// Copyright (c) 2024 - 2025 MrKBear

export interface OperationContext {
    view: DataView;
    offset: number;
    littleEndian?: boolean;
}

export interface OperationReactiveContext extends OperationContext {
    getBaseOffset: () => number;
    localOffset: number;
    state?: any;
}

export type OperationGetter<T> = (context: OperationContext) => T;

export type OperationSetter<T> = (context: OperationContext, value: T) => void;

export type OperationReactive<T> = (context: OperationReactiveContext) => T;

export const isTypeDefSymbol = Symbol("IsTypeDef");

export interface TypeDef<T> {
    [isTypeDefSymbol]: true;
    name: string;
    size: number;
    align?: number;
    littleEndian?: boolean;
    getter: OperationGetter<T>;
    setter: OperationSetter<T>;
    reactive?: OperationReactive<T>;
}

export function isTypeDef(test: any): test is TypeDef<any> {
    if (typeof test !== "object" || test === null) {
        return false;
    }
    if ((test as any)[isTypeDefSymbol]) {
        return true;
    }
    return false;
}

export interface TypeDefContext<T> extends TypeDef<T> {
    setName(name?: string): TypeDefContext<T>;
    setSize(size?: number): TypeDefContext<T>;
    setAlign(align?: number): TypeDefContext<T>;
    setLittleEndian(littleEndian?: boolean): TypeDefContext<T>;
    setGetter(getter?: OperationGetter<T>): TypeDefContext<T>;
    setSetter(setter?: OperationSetter<T>): TypeDefContext<T>;
    setReactive(reactive?: OperationReactive<T>): TypeDefContext<T>;
    freeze(): TypeDefContext<T>;
    clone(name?: string): TypeDefContext<T>;
}

export function defineType<T = any>(name?: string): TypeDefContext<T> {
    let isFreeze = false;
    const testFreeze = (): void => {
        if (isFreeze) {
            throw new Error();
        }
    }
    const setName: TypeDefContext<T>["setName"] = (name) => {
        testFreeze();
        typeDef.name = name ?? "unknown";
        return typeDef;
    };
    const setSize: TypeDefContext<T>["setSize"] = (size) => {
        testFreeze();
        typeDef.size = size ?? 0;
        return typeDef;
    };
    const setAlign: TypeDefContext<T>["setAlign"] = (align) => {
        testFreeze();
        typeDef.align = align;
        return typeDef;
    };
    const setLittleEndian: TypeDefContext<T>["setLittleEndian"] = (littleEndian) => {
        testFreeze();
        typeDef.littleEndian = littleEndian;
        return typeDef;
    };
    const setGetter: TypeDefContext<T>["setGetter"] = (newGetter) => {
        testFreeze();
        typeDef.getter = newGetter ?? getter;
        return typeDef;
    };
    const setSetter: TypeDefContext<T>["setSetter"] = (newSetter) => {
        testFreeze();
        typeDef.setter = newSetter ?? setter;
        return typeDef;
    };
    const setReactive: TypeDefContext<T>["setReactive"] = (reactive) => {
        testFreeze();
        typeDef.reactive = reactive;
        return typeDef;
    };
    const freeze: TypeDefContext<T>["freeze"] = () => {
        isFreeze = true;
        Object.freeze(typeDef);
        return typeDef;
    };
    const clone: TypeDefContext<T>["clone"] = (name) => {
        const newInstance = defineType<T>(name ?? typeDef.name);
        newInstance.size = typeDef.size;
        newInstance.align = typeDef.align;
        newInstance.littleEndian = typeDef.littleEndian;
        newInstance.getter = typeDef.getter;
        newInstance.setter = typeDef.setter;
        newInstance.reactive = typeDef.reactive;
        return newInstance;
    };
    const getter: OperationGetter<T> = () => {
        throw new Error();
    };
    const setter: OperationSetter<T> = () => {
        throw new Error();
    };
    const typeDef: TypeDefContext<T> = {
        [isTypeDefSymbol]: true,
        name: name ?? "unknown",
        size: 0,
        getter,
        setter,
        setName,
        setSize,
        setAlign,
        setLittleEndian,
        setGetter,
        setSetter,
        setReactive,
        freeze,
        clone
    };
    return typeDef;
}

type Flatten<T> = {} & { [K in keyof T]: T[K] };

export type StructDefKey = string | symbol;

export interface StructDefProp<T> {
    key: StructDefKey;
    type: TypeDef<T>;
    offset: number;
    staticOffset?: number;
    padding?: boolean;
}

export interface StructDefPropOptions<T> {
    type: TypeDef<T>;
    order?: number;
    offset?: number;
    padding?: boolean;
}

export type StructDefOptions<T extends Record<StructDefKey, any>> = {
    [K in keyof T]: TypeDef<T[K]> | StructDefPropOptions<T[K]>
}

export interface StructDefContext<T extends Record<StructDefKey, any>> extends TypeDef<T> {
    maxAlign: number;
    keys: ReadonlyArray<StructDefKey>;
    props: ReadonlyMap<StructDefKey, StructDefProp<any>>;
    propList: Array<StructDefProp<any>>;
    setName(name: string): StructDefContext<T>;
    setAlign(align?: number): StructDefContext<T>;
    setLittleEndian(littleEndian?: boolean): StructDefContext<T>;
    updateLayout(): StructDefContext<T>;
    setOptions<M extends Record<StructDefKey, any>>(options: StructDefOptions<M>): StructDefContext<M>;
    addProp<K extends StructDefKey, V>(key: K extends keyof T ? never : K, type: TypeDef<V>, offset?: number): StructDefContext<Flatten<T & { [X in K]: V }>>;
    addPadding(type: TypeDef<any>, offset?: number): StructDefContext<T>;
    updateProp<K extends keyof T, V>(key: K, type: TypeDef<V>, offset?: number): StructDefContext<Flatten<Omit<T, K> & { [P in K]: V }>>;
    removeProp<K extends keyof T>(key: K): StructDefContext<Flatten<Omit<T, K>>>;
    freeze(): StructDefContext<T>;
    clone(name?: string): StructDefContext<T>;
}

export function defineStruct<T extends Record<StructDefKey, any> = {}>(options: StructDefOptions<T>, customName?: string): StructDefContext<T> {
    let isFreeze = false;
    const testFreeze = (): void => {
        if (isFreeze) {
            throw new Error();
        }
    }
    const updateLayout = () => {
        testFreeze();
        const { propList } = typeDef;
        const keys = new Array<StructDefKey>;
        const props = new Map<StructDefKey, StructDefProp<any>>();
        let maxAlign: number = 1;
        let offset: number = 0;
        for (const prop of propList) {
            if (!prop.padding) {
                keys.push(prop.key);
                props.set(prop.key, prop);
            }
            // Static offset
            if (typeof prop.staticOffset === "number") {
                offset = prop.staticOffset;
                prop.offset = offset;
                continue;
            }
            // Update max align
            const align = Math.max(prop.type.align ?? prop.type.size, 1);
            maxAlign = Math.max(maxAlign, align);
            // Padding calculation
            const padding = (align - (offset % align)) % align;
            // Update offset
            offset += padding + prop.type.size
            prop.offset = offset;
        }
        // End padding
        const endPadding = (maxAlign - (offset % maxAlign)) % maxAlign;
        offset += endPadding;
        // Update
        typeDef.maxAlign = maxAlign;
        typeDef.size = offset;
        typeDef.keys = keys;
        typeDef.props = props;
        return typeDef;
    };
    const setName: StructDefContext<T>["setName"] = (name) => {
        testFreeze();
        typeDef.name = name ?? "unknown";
        return typeDef;
    };
    const setAlign: StructDefContext<T>["setAlign"] = (align) => {
        testFreeze();
        typeDef.align = align;
        return typeDef;
    };
    const setLittleEndian: StructDefContext<T>["setLittleEndian"] = (littleEndian) => {
        testFreeze();
        typeDef.littleEndian = littleEndian;
        return typeDef;
    };
    const setOptions: StructDefContext<T>["setOptions"] = (options) => {
        const orderList: Array<StructDefPropOptions<any> & { key: StructDefKey, order: number }> = [];
        const list: Array<StructDefPropOptions<any> & { key: StructDefKey }> = [];
        for (const [key, value] of Object.entries(options)) {
            if (isTypeDef(value)) {
                list.push({ key: key, type: value });
                continue;
            }
            if (typeof value.order === "number") {
                orderList.push({ key: key, ...value });
                continue;
            }
            list.push({ key: key, ...value });
        }
        orderList.sort((a, b) => a.order - b.order);
        list.sort((a, b) => {
            const alignA = a.type.align ?? a.type.size;
            const alignB = b.type.align ?? b.type.size;
            return alignB - alignA;
        });
        const mapToProp = (options: StructDefPropOptions<any> & { key: StructDefKey }): StructDefProp<any> => {
            return {
                key: options.key,
                type: options.type,
                offset: 0,
                staticOffset: options.offset,
                padding: options.padding
            }
        }
        typeDef.propList = [...orderList.map(mapToProp), ...list.map(mapToProp)];
        return updateLayout() as StructDefContext<any>;
    };
    const pushProp = (prop: StructDefProp<any>): StructDefContext<T> => {
        testFreeze();
        const { props, propList } = typeDef;
        // Duplicate Check
        if (props.has(prop.key)) {
            throw new Error();
        }
        // Update
        propList.push(prop);
        return updateLayout();
    };
    const addProp: StructDefContext<T>["addProp"] = (key, type, staticOffset) => pushProp({
        key: key,
        type: type,
        offset: 0,
        staticOffset
    });
    const addPadding: StructDefContext<T>["addPadding"] = (type, staticOffset) => pushProp({
        key: Symbol("padding"),
        type: type,
        offset: 0,
        staticOffset,
        padding: true
    });
    const updateProp: StructDefContext<T>["updateProp"] = (key, type, staticOffset) => {
        testFreeze();
        const { props } = typeDef;
        const prop = props.get(key as StructDefKey);
        if (!prop) {
            throw new Error();
        }
        // Update
        prop.type = type;
        prop.staticOffset = staticOffset;
        return updateLayout() as StructDefContext<any>;
    };
    const removeProp: StructDefContext<T>["removeProp"] = (key) => {
        testFreeze();
        const { propList } = typeDef;
        const propIndex = propList.findIndex(prop => prop.key === key);
        if (propIndex < 0) {
            throw new Error();
        }
        // Delete
        propList.splice(propIndex, 1);
        return updateLayout() as StructDefContext<any>;
    };
    const freeze: StructDefContext<T>["freeze"] = () => {
        isFreeze = true;
        for (const prop of typeDef.propList) {
            Object.freeze(prop);
        }
        Object.freeze(typeDef.keys);
        Object.freeze(typeDef.props);
        Object.freeze(typeDef.propList);
        Object.freeze(typeDef);
        return typeDef;
    };
    const clone: StructDefContext<T>["clone"] = (name) => {
        const newInstance = defineStruct<T>({} as any, name ?? typeDef.name);
        newInstance.size = typeDef.size;
        newInstance.align = typeDef.align;
        newInstance.littleEndian = typeDef.littleEndian;
        newInstance.maxAlign = typeDef.maxAlign;
        for (const prop of typeDef.propList) {
            newInstance.propList.push({
                key: prop.key,
                type: prop.type,
                offset: prop.offset,
                staticOffset: prop.staticOffset,
                padding: prop.padding
            });
        }
        return newInstance.updateLayout();
    };
    const getter: OperationGetter<T> = ({ view, offset, littleEndian }) => {
        const structure: Record<StructDefKey, any> = {};
        for (const [, prop] of typeDef.props) {
            structure[prop.key] = prop.type.getter({
                view,
                offset: offset + prop.offset,
                littleEndian: littleEndian ?? prop.type.littleEndian,
            });
        }
        return structure as T;
    };
    const setter: OperationSetter<T> = ({ view, offset, littleEndian }, value) => {
        for (const [, prop] of typeDef.props) {
            prop.type.setter({
                view,
                offset: offset + prop.offset,
                littleEndian: littleEndian ?? prop.type.littleEndian,
            }, value[prop.key]);
        }
    };
    const reactive: OperationReactive<T> = (context) => {
        const { state } = context;
        // Proxy cached
        if (state) {
            return state;
        }
        // Create proxy
        const { view, littleEndian, localOffset, getBaseOffset } = context;
        const { props, keys } = typeDef;
        // Used to create prop type operation context
        const createContext = (prop: StructDefProp<any>): OperationReactiveContext => {
            const propLocalOffset = localOffset + prop.offset;
            const propContext: OperationReactiveContext = {
                view,
                // Adapt to regular types
                get offset() {
                    return getBaseOffset() + propLocalOffset;
                },
                littleEndian: littleEndian ?? prop.type.littleEndian,
                localOffset: propLocalOffset,
                getBaseOffset
            };
            return propContext;
        };
        // Prop getter
        const getterMap = new Map<StructDefKey, () => any>();
        const get: ProxyHandler<T>["get"] = (target, key) => {
            let getter = getterMap.get(key);
            if (getter) {
                return getter();
            }
            const prop = props.get(key);
            if (!prop) {
                return void 0;
            }
            const propContext = createContext(prop);
            const propGetter = prop.type.reactive ?? prop.type.getter;
            getter = () => propGetter(propContext);
            getterMap.set(key, getter);
            return getter();
        };
        // Prop setter
        const set: ProxyHandler<T>["set"] = (target, key, value) => {
            const prop = props.get(key);
            if (!prop) {
                return false;
            }
            prop.type.setter({
                view,
                offset: getBaseOffset() + localOffset + prop.offset,
                littleEndian: littleEndian ?? prop.type.littleEndian,
            }, value);
            return true;
        };
        const has: ProxyHandler<T>["has"] = (target, key) => {
            return props.has(key);
        };
        const ownKeys: ProxyHandler<T>["ownKeys"] = () => {
            return keys;
        };
        const proxy = new Proxy({} as T, {
            get,
            set,
            has,
            ownKeys
        });
        context.state = proxy;
        return proxy;
    }
    let name: string | undefined = customName;
    let align: number | undefined;
    const typeDef: StructDefContext<T> = {
        [isTypeDefSymbol]: true,
        get name() {
            return name ?? `struct{${typeDef.keys.length}}`
        },
        set name(value) {
            testFreeze();
            name = value;
        },
        size: 0,
        get align() {
            return align ?? typeDef.maxAlign;
        },
        set align(value) {
            testFreeze();
            align = value;
        },
        getter,
        setter,
        reactive,
        maxAlign: 1,
        keys: [],
        props: new Map(),
        propList: [],
        setName,
        setAlign,
        setLittleEndian,
        updateLayout,
        setOptions,
        addProp,
        addPadding,
        updateProp,
        removeProp,
        freeze,
        clone
    }
    return typeDef;
}

export interface ArrayDefContext<T = any> extends TypeDef<Array<T>> {
    element: TypeDef<T>;
    length: number;
    setName(name: string): ArrayDefContext<T>;
    setAlign(align?: number): ArrayDefContext<T>;
    setLittleEndian(littleEndian?: boolean): ArrayDefContext<T>;
    setElement<M>(type: TypeDef<M>): ArrayDefContext<M>;
    setLength(length: number): ArrayDefContext<T>;
    freeze(): ArrayDefContext<T>;
    clone(name?: string): ArrayDefContext<T>;
}

export function defineArray<T>(element: TypeDef<T>, length: number, customName?: string): ArrayDefContext<T> {
    let isFreeze = false;
    const testFreeze = (): void => {
        if (isFreeze) {
            throw new Error();
        }
    }
    const setName: ArrayDefContext<T>["setName"] = (name) => {
        testFreeze();
        typeDef.name = name ?? "unknown";
        return typeDef;
    };
    const setAlign: ArrayDefContext<T>["setAlign"] = (align) => {
        testFreeze();
        typeDef.align = align;
        return typeDef;
    };
    const setLittleEndian: ArrayDefContext<T>["setLittleEndian"] = (littleEndian) => {
        testFreeze();
        typeDef.littleEndian = littleEndian;
        return typeDef;
    };
    const setElement: ArrayDefContext<T>["setElement"] = (element: TypeDef<any>) => {
        testFreeze();
        typeDef.element = element;
        typeDef.size = element.size * typeDef.length;
        return typeDef as ArrayDefContext<any>;
    };
    const setLength: ArrayDefContext<T>["setLength"] = (length) => {
        testFreeze();
        typeDef.length = length;
        typeDef.size = typeDef.element.size * length;
        return typeDef;
    };
    const freeze: ArrayDefContext<T>["freeze"] = () => {
        isFreeze = true;
        Object.freeze(typeDef);
        return typeDef;
    };
    const clone: ArrayDefContext<T>["clone"] = (newName) => {
        const newInstance = defineArray<T>(typeDef.element, typeDef.length, newName ?? name);
        newInstance.size = typeDef.size;
        newInstance.align = typeDef.align;
        newInstance.littleEndian = typeDef.littleEndian;
        return newInstance;
    };
    const getter: OperationGetter<Array<T>> = ({ view, offset, littleEndian }) => {
        const { element, length } = typeDef;
        const array: Array<T> = [];
        for (let index = 0; index < length; index++) {
            array.push(element.getter({
                view,
                offset: offset + index * element.size,
                littleEndian: littleEndian ?? element.littleEndian,
            }));
        }
        return array;
    };
    const setter: OperationSetter<Array<T>> = ({ view, offset, littleEndian }, value) => {
        const { element, length } = typeDef;
        for (let index = 0; index < length; index++) {
            element.setter({
                view,
                offset: offset + index * element.size,
                littleEndian: littleEndian ?? element.littleEndian,
            }, value[index]);
        }
    };
    const reactive: OperationReactive<Array<T>> = (context) => {
        const { state } = context;
        // Proxy cached
        if (state) {
            return state;
        }
        // Create proxy
        const { view, littleEndian, localOffset, getBaseOffset } = context;
        const { element, length } = typeDef;
        // Used to create element type operation context
        const createContext = (index: number): OperationReactiveContext => {
            const elementLocalOffset = localOffset + index * element.size;
            const elementContext: OperationReactiveContext = {
                view,
                // Adapt to regular types
                get offset() {
                    return getBaseOffset() + elementLocalOffset;
                },
                littleEndian: littleEndian ?? element.littleEndian,
                localOffset: elementLocalOffset,
                getBaseOffset
            };
            return elementContext;
        };
        // Element getter
        const getterMap = new Map<number, () => T>();
        const getElement = (index: number): T => {
            let getter = getterMap.get(index);
            if (getter) {
                return getter();
            }
            const elementContext = createContext(index);
            const elementGetter = element.reactive ?? element.getter;
            getter = () => elementGetter(elementContext);
            getterMap.set(index, getter);
            return getter();
        }
        // Symbol.iterator
        const iterator = function* (): ArrayIterator<T> {
            for (let index = 0; index < length; index++) {
                yield getElement(index);
            }
        }
        // Built-in props
        const internal = new Map<symbol | string, any>([
            ["length", length],
            [Symbol.iterator, iterator]
        ]);
        // getter
        const get: ProxyHandler<Array<T>>["get"] = (target, key) => {
            if (typeof key === "symbol") {
                return internal.get(key);
            }
            const index = Number(key);
            if (isNaN(index)) {
                return internal.get(key);
            }
            if (index < 0 || index >= length) {
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
            if (index < 0 || index >= length) {
                return false;
            }
            element.setter({
                view,
                offset: getBaseOffset() + localOffset + index * element.size,
                littleEndian: littleEndian ?? element.littleEndian,
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
            if (index < 0 || index >= length) {
                return false;
            }
            return true;
        };
        let keys: string[] | undefined;
        const ownKeys: ProxyHandler<Array<T>>["ownKeys"] = () => {
            if (keys) {
                return keys;
            }
            keys = [];
            for (let index = 0; index < length; index++) {
                keys.push(String(index));
            }
            return keys;
        };
        const proxy = new Proxy([] as Array<T>, {
            get,
            set,
            has,
            ownKeys
        });
        context.state = proxy;
        return proxy;
    };
    let name: string | undefined = customName;
    let align: number | undefined;
    const typeDef: ArrayDefContext<T> = {
        [isTypeDefSymbol]: true,
        get name() {
            return name ?? `${typeDef.element.name}[${typeDef.length}]`
        },
        set name(value) {
            testFreeze();
            name = value;
        },
        size: 0,
        get align() {
            return align ?? typeDef.element.align;
        },
        set align(value) {
            testFreeze();
            align = value;
        },
        getter,
        setter,
        reactive,
        element,
        length,
        setName,
        setAlign,
        setLittleEndian,
        setElement,
        setLength,
        freeze,
        clone
    };
    return typeDef;
}
