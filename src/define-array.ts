import { TypeDefinitionSymbol, OperationRawSymbol } from "./core";
import { UNKNOWN } from "./types";
import type { OperationGetter, OperationSetter, OperationReactive } from "./core";
import type { TypeDefinition, OperationContextDynamic } from "./core";

export interface ArrayDefinitionFreezed<T> extends TypeDefinition<Array<T>> {
    element: TypeDefinition<T>;
    length: number;
    clone(name?: string): ArrayDefinition<T>;
}

export interface ArrayDefinition<T> extends ArrayDefinitionFreezed<T> {
    setName(name?: string): ArrayDefinition<T>;
    setSize(size?: number): ArrayDefinition<T>;
    setAlign(align?: number): ArrayDefinition<T>;
    setElement<M>(type?: TypeDefinition<M>): ArrayDefinition<M>;
    setLength(length?: number): ArrayDefinition<T>;
    freeze(): ArrayDefinitionFreezed<T>;
}

export function defineArray(name?: string): ArrayDefinition<unknown>;
export function defineArray<T>(element: TypeDefinition<T>, length?: number, name?: string): ArrayDefinition<T>;
export function defineArray<T>(param0?: TypeDefinition<T> | string, length?: number, name?: string): ArrayDefinition<T> {
    let _name: string | undefined;
    let _size: number | undefined;
    let _align: number | undefined;
    let _element: TypeDefinition<any> = UNKNOWN;
    let _length: number = 0;
    const setName: ArrayDefinition<T>["setName"] = (name) => {
        _name = name;
        return typeDefinition;
    };
    const setSize: ArrayDefinition<T>["setSize"] = (size) => {
        _size = size;
        return typeDefinition;
    };
    const setAlign: ArrayDefinition<T>["setAlign"] = (align) => {
        _align = align;
        return typeDefinition;
    };
    const setElement: ArrayDefinition<T>["setElement"] = (element) => {
        _element = element ?? UNKNOWN;
        return typeDefinition as any;
    };
    const setLength: ArrayDefinition<T>["setLength"] = (length) => {
        _length = length ?? 0;
        return typeDefinition;
    };
    const freeze: ArrayDefinition<T>["freeze"] = () => {
        const newDefinition = clone();
        return Object.freeze({
            isTypeDefinition: TypeDefinitionSymbol,
            name: newDefinition.name,
            size: newDefinition.size,
            align: newDefinition.align,
            element: newDefinition.element,
            length: newDefinition.length,
            getter: newDefinition.getter,
            setter: newDefinition.setter,
            reactive: newDefinition.reactive,
            clone: newDefinition.clone
        });
    };
    const clone: ArrayDefinition<T>["clone"] = (name) => defineArray<T>(_element, _length, name ?? _name)
        .setSize(_size)
        .setAlign(_align);
    const getter: OperationGetter<Array<T>> = ({ view, offset, littleEndian }) => {
        const array: Array<T> = [];
        for (let index = 0; index < _length; index++) {
            array.push(_element.getter({
                view,
                offset: offset + index * _element.size,
                littleEndian: littleEndian
            }));
        }
        return array;
    };
    const setter: OperationSetter<Array<T>> = ({ view, offset, littleEndian }, value) => {
        for (let index = 0; index < _length; index++) {
            _element.setter({
                view,
                offset: offset + index * _element.size,
                littleEndian: littleEndian
            }, value[index]);
        }
    };
    const reactive: OperationReactive<Array<T>> = ({ view, littleEndian, localOffset, baseOffset, cacheGetter }) => {
        const toRaw = () => typeDefinition.getter({
            view,
            offset: baseOffset() + localOffset,
            littleEndian
        });
        // Element getter
        const getterMap = new Map<number, () => T>();
        const getElement = (index: number): T => {
            let getter = getterMap.get(index);
            if (getter) {
                return getter();
            }
            const context: OperationContextDynamic = {
                view,
                littleEndian,
                localOffset: localOffset + index * _element.size,
                baseOffset,
                cacheGetter: getter => getterMap.set(index, getter)
            };
            getter = () => _element.reactive(context);
            getterMap.set(index, getter);
            return getter();
        };
        // To Array
        let cachedArray: Array<T> | undefined;
        const getArray = (): Array<T> => {
            if (cachedArray) {
                return cachedArray;
            }
            cachedArray = new Array(_length);
            for (let index = 0; index < _length; index++) {
                cachedArray[index] = getElement(index);
            }
            return cachedArray;
        };
        // Common array func proxy
        const callArray = (key: any): any => {
            const func = Array.prototype[key];
            if (typeof func !== "function") {
                return void 0;
            }
            const caller = (...param: any[]) => {
                const array = getArray();
                const copyArray = array.slice();
                const result = func.call(copyArray, ...param);
                if (copyArray.length !== array.length) {
                    throw new Error();
                }
                typeDefinition.setter({
                    view,
                    offset: baseOffset() + localOffset,
                    littleEndian
                }, copyArray);
                return result;
            }
            internal.set(key, caller);
            return caller;
        };
        // Symbol.iterator
        const iterator = function* (): ArrayIterator<T> {
            for (let index = 0; index < _length; index++) {
                yield getElement(index);
            }
        };
        const forEach: Array<T>["forEach"] = (callback, thisArg) => {
            for (let index = 0; index < _length; index++) {
                callback.call(thisArg, getElement(index), index, proxy);
            }
        };
        const map: Array<T>["map"] = (callback, thisArg) => {
            const result = new Array<any>(_length);
            for (let index = 0; index < _length; index++) {
                result[index] = callback.call(thisArg, getElement(index), index, proxy);
            }
            return result;
        };
        // Built-in props
        const internal = new Map<symbol | string, any>([
            ["length", _length],
            ["forEach", forEach],
            ["map", map],
            [Symbol.iterator, iterator],
            [OperationRawSymbol, toRaw]
        ]);
        // getter
        const get: ProxyHandler<Array<T>>["get"] = (target, key) => {
            if (typeof key === "symbol") {
                return internal.has(key) ? internal.get(key) : callArray(key);
            }
            const index = Number(key);
            if (isNaN(index)) {
                return internal.has(key) ? internal.get(key) : callArray(key);
            }
            if (index < 0 || index >= _length) {
                return void 0;
            }
            return getElement(index);
        };
        // setter
        const set: ProxyHandler<Array<T>>["set"] = (target, key, value) => {
            if (typeof key === "symbol") {
                return false;
            }
            const index = Number(key);
            if (isNaN(index)) {
                return false;
            }
            if (index < 0 || index >= _length) {
                return false;
            }
            _element.setter({
                view,
                offset: baseOffset() + localOffset + index * _element.size,
                littleEndian: littleEndian
            }, value);
            return true;
        };
        const has: ProxyHandler<Array<T>>["has"] = (target, key) => {
            if (typeof key === "symbol") {
                return false;
            }
            const index = Number(key);
            if (isNaN(index)) {
                return false;
            }
            if (index < 0 || index >= _length) {
                return false;
            }
            return true;
        };
        let keys: string[] | undefined;
        const ownKeys: ProxyHandler<Array<T>>["ownKeys"] = () => {
            if (keys) {
                return keys;
            }
            keys = new Array(_length);
            for (let index = 0; index < _length; index++) {
                keys[index] = String(index);
            }
            return keys;
        };
        const defineProperty: ProxyHandler<Array<T>>["defineProperty"] = () => false;
        const deleteProperty: ProxyHandler<Array<T>>["deleteProperty"] = () => false;
        const proxy = new Proxy([] as Array<T>, {
            get,
            set,
            has,
            ownKeys,
            defineProperty,
            deleteProperty
        });
        cacheGetter(() => proxy);
        return proxy;
    };
    const typeDefinition: ArrayDefinition<T> = {
        isTypeDefinition: TypeDefinitionSymbol,
        get name() {
            return _name ?? `${_element.name}[${_length}]`;
        },
        get size() {
            return Math.max(_size ?? _element.size * _length, 0);
        },
        get align() {
            return Math.max(_align ?? _element.align, 1);
        },
        get element() {
            return _element;
        },
        get length() {
            return _length;
        },
        getter,
        setter,
        reactive,
        setName,
        setSize,
        setAlign,
        setElement,
        setLength,
        freeze,
        clone
    };
    if (typeof param0 === "object") {
        setElement(param0);
        setLength(length);
        setName(name);
    }
    else {
        setName(param0);
    }
    return typeDefinition;
}
