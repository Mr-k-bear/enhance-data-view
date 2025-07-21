import { TypeDefinitionSymbol, OperationRawSymbol, toRaw } from "./core";
import { UNKNOWN } from "./types";
import type { OperationGetter, OperationSetter, OperationReactive } from "./core";
import type { TypeDefinition, OperationContextDynamic } from "./core";

/**
 * Immutable array type definition (frozen state)
 * @template T - Element type of the array
 */
export interface ArrayDefinitionFreezed<T> extends TypeDefinition<Array<T>> {
    /** Type definition for array elements */
    element: TypeDefinition<T>;
    /**
     * When using an array setter, 
     * if the length of the incoming data is less than the length of the array,
     * fill in the remaining positions with values, Default is not filled
     */
    fill: T | undefined;
    /** Fixed length of the array */
    length: number;
    /**
     * Creates a mutable clone of the array definition
     * @param name - Optional new name for cloned definition
     * @returns New mutable array definition
     * @example 
     * const cloned = frozenArray.clone('RenamedArray');
     */
    clone(name?: string): ArrayDefinition<T>;
}

/**
 * Mutable array type definition with chainable configuration
 * @template T - Element type of the array
 * @remarks 
 * - Represents fixed-length arrays of specified element type
 * - Supports chainable configuration before freezing
 */
export interface ArrayDefinition<T> extends ArrayDefinitionFreezed<T> {
    /**
     * Sets array type name
     * @param name - New name for the array type
     * @returns Current instance for chaining
     */
    setName(name?: string): ArrayDefinition<T>;
    /**
     * Sets fixed byte size for the entire array
     * @param size - Total byte size override
     * @returns Current instance for chaining
     * @remarks 
     * - Overrides calculated size (element size × length)
     * - Use with caution - incorrect size may cause data corruption
     */
    setSize(size?: number): ArrayDefinition<T>;
    /**
     * Sets memory alignment requirement
     * @param align - Alignment requirement
     * @returns Current instance for chaining
     * @remarks 
     * - Defaults to element's alignment
     */
    setAlign(align?: number): ArrayDefinition<T>;
    /**
     * Changes element type
     * @template M - New element type
     * @param type - New element type definition
     * @param fill - When using an array setter, 
     * if the length of the incoming data is less than the length of the array,
     * fill in the remaining positions with values, Default is not filled
     * @returns Current array definition with updated element type
     */
    setElement<M>(type?: TypeDefinition<M>, fill?: M): ArrayDefinition<M>;
    /**
     * Changes array length
     * @param length - New element count
     * @returns Current instance for chaining
     */
    setLength(length?: number): ArrayDefinition<T>;
    /**
     * Freezes the type definition to prevent modification
     * @returns Immutable version of the type definition
     * @remarks 
     * - Improves performance by preventing runtime changes
     * - Should be called after final configuration
     * @example 
     * const finalType = mutableType.freeze();
     */
    freeze(): ArrayDefinitionFreezed<T>;
}

/**
 * Creates configurable array type definition
 * @overload
 * @param name - Array type name
 * @returns Empty array definition (unknown element type, length=0)
 */
export function defineArray(name?: string): ArrayDefinition<unknown>;
/**
 * Creates configurable array type definition
 * @overload
 * @param element - Element type definition
 * @param length - Array element count
 * @param name - Optional array type name
 * @param fill - When using an array setter, 
 * if the length of the incoming data is less than the length of the array,
 * fill in the remaining positions with values, Default is not filled
 * @returns Configured array definition
 * @template T - Element type
 * @example 
 */
export function defineArray<T>(element: TypeDefinition<T>, length?: number, fill?: T, name?: string): ArrayDefinition<T>;
/**
 * Array definition implementation
 * @param param0 - Element type or name
 * @param length - Array length
 * @param name - Array name
 * @returns Array definition instance
 */
export function defineArray<T>(param0?: TypeDefinition<T> | string, length?: number, fill?: T, name?: string): ArrayDefinition<T> {
    let _name: string | undefined;
    let _size: number | undefined;
    let _align: number | undefined;
    let _element: TypeDefinition<any> = UNKNOWN;
    let _fill: any | undefined;
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
    const setElement: ArrayDefinition<T>["setElement"] = (element, fill) => {
        _element = element ?? UNKNOWN;
        _fill = fill;
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
            fill: newDefinition.fill,
            length: newDefinition.length,
            getter: newDefinition.getter,
            setter: newDefinition.setter,
            reactive: newDefinition.reactive,
            clone: newDefinition.clone
        });
    };
    const clone: ArrayDefinition<T>["clone"] = (name) => defineArray<T>(_element, _length, _fill, name ?? _name)
        .setSize(_size)
        .setAlign(_align);
    const getter: OperationGetter<Array<T>> = ({ view, offset, littleEndian }) => {
        const array = new Array<T>(_length);
        for (let index = 0; index < _length; index++) {
            array[index] = _element.getter({
                view,
                offset: offset + index * _element.size,
                littleEndian
            });
        }
        return array;
    };
    const setter: OperationSetter<Array<T>> = ({ view, offset, littleEndian }, value) => {
        const valueLength = value.length;
        const minLength = Math.min(valueLength, _length);
        for (let index = 0; index < minLength; index++) {
            _element.setter({
                view,
                offset: offset + index * _element.size,
                littleEndian
            }, value[index]);
        }
        if (_fill !== void 0 && valueLength < _length) {
            for (let index = valueLength; index < _length; index++) {
                _element.setter({
                    view,
                    offset: offset + index * _element.size,
                    littleEndian
                }, _fill);
            }
        }
    };
    const reactive: OperationReactive<Array<T>> = ({ view, littleEndian, localOffset, baseOffset, cacheGetter }) => {
        const proxyToRaw = () => typeDefinition.getter({
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
                typeDefinition.setter({
                    view,
                    offset: baseOffset() + localOffset,
                    littleEndian
                }, copyArray.map(x => toRaw(x)));
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
            [OperationRawSymbol, proxyToRaw]
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
        get fill() {
            return _fill;
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
        setElement(param0, fill);
        setLength(length);
        setName(name);
    }
    else {
        setName(param0);
    }
    return typeDefinition;
}
