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

export const isTypeDefinitionSymbol = Symbol("IsTypeDefinition");

export interface TypeDefinition<T> {
    [isTypeDefinitionSymbol]: true;
    name: string;
    size: number;
    align?: number;
    littleEndian?: boolean;
    getter: OperationGetter<T>;
    setter: OperationSetter<T>;
    reactive?: OperationReactive<T>;
}

export function isTypeDefinition(test: any): test is TypeDefinition<any> {
    if (typeof test !== "object" || test === null) {
        return false;
    }
    if ((test as any)[isTypeDefinitionSymbol]) {
        return true;
    }
    return false;
}

export interface TypeDefinitionContext<T> extends TypeDefinition<T> {
    setName(name?: string): TypeDefinitionContext<T>;
    setSize(size?: number): TypeDefinitionContext<T>;
    setAlign(align?: number): TypeDefinitionContext<T>;
    setLittleEndian(littleEndian?: boolean): TypeDefinitionContext<T>;
    setGetter(getter?: OperationGetter<T>): TypeDefinitionContext<T>;
    setSetter(setter?: OperationSetter<T>): TypeDefinitionContext<T>;
    setReactive(reactive?: OperationReactive<T>): TypeDefinitionContext<T>;
    freeze(): TypeDefinitionContext<T>;
    clone(name?: string): TypeDefinitionContext<T>;
}

export function defineType<T = any>(name?: string): TypeDefinitionContext<T> {
    let isFreeze = false;
    const testFreeze = (): void => {
        if (isFreeze) {
            throw new Error();
        }
    }
    const setName: TypeDefinitionContext<T>["setName"] = (name) => {
        testFreeze();
        typeDefinition.name = name ?? "unknown";
        return typeDefinition;
    };
    const setSize: TypeDefinitionContext<T>["setSize"] = (size) => {
        testFreeze();
        typeDefinition.size = size ?? 0;
        return typeDefinition;
    };
    const setAlign: TypeDefinitionContext<T>["setAlign"] = (align) => {
        testFreeze();
        typeDefinition.align = align;
        return typeDefinition;
    };
    const setLittleEndian: TypeDefinitionContext<T>["setLittleEndian"] = (littleEndian) => {
        testFreeze();
        typeDefinition.littleEndian = littleEndian;
        return typeDefinition;
    };
    const setGetter: TypeDefinitionContext<T>["setGetter"] = (newGetter) => {
        testFreeze();
        typeDefinition.getter = newGetter ?? getter;
        return typeDefinition;
    };
    const setSetter: TypeDefinitionContext<T>["setSetter"] = (newSetter) => {
        testFreeze();
        typeDefinition.setter = newSetter ?? setter;
        return typeDefinition;
    };
    const setReactive: TypeDefinitionContext<T>["setReactive"] = (reactive) => {
        testFreeze();
        typeDefinition.reactive = reactive;
        return typeDefinition;
    };
    const freeze: TypeDefinitionContext<T>["freeze"] = () => {
        isFreeze = true;
        Object.freeze(typeDefinition);
        return typeDefinition;
    };
    const clone: TypeDefinitionContext<T>["clone"] = (name) => {
        const newInstance = defineType<T>(name ?? typeDefinition.name);
        newInstance.size = typeDefinition.size;
        newInstance.align = typeDefinition.align;
        newInstance.littleEndian = typeDefinition.littleEndian;
        newInstance.getter = typeDefinition.getter;
        newInstance.setter = typeDefinition.setter;
        newInstance.reactive = typeDefinition.reactive;
        return newInstance;
    };
    const getter: OperationGetter<T> = () => {
        throw new Error();
    };
    const setter: OperationSetter<T> = () => {
        throw new Error();
    };
    const typeDefinition: TypeDefinitionContext<T> = {
        [isTypeDefinitionSymbol]: true,
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
    return typeDefinition;
}

type Flatten<T> = {} & { [K in keyof T]: T[K] };

export type StructDefinitionKey = string | symbol;

export interface StructDefinitionProperty<T> {
    key: StructDefinitionKey;
    type: TypeDefinition<T>;
    offset: number;
    staticOffset?: number;
    padding?: boolean;
}

export interface StructDefinitionPropertyOptions<T> {
    type: TypeDefinition<T>;
    order?: number;
    offset?: number;
    padding?: boolean;
}

export type StructDefinitionOptions<T extends Record<StructDefinitionKey, any>> = {
    [K in keyof T]: TypeDefinition<T[K]> | StructDefinitionPropertyOptions<T[K]>
}

export interface StructDefinitionContext<T extends Record<StructDefinitionKey, any>> extends TypeDefinition<T> {
    maxAlign: number;
    keys: ReadonlyArray<StructDefinitionKey>;
    properties: ReadonlyMap<StructDefinitionKey, StructDefinitionProperty<any>>;
    propertyList: Array<StructDefinitionProperty<any>>;
    setName(name: string): StructDefinitionContext<T>;
    setAlign(align?: number): StructDefinitionContext<T>;
    setLittleEndian(littleEndian?: boolean): StructDefinitionContext<T>;
    updateLayout(): StructDefinitionContext<T>;
    setOptions<M extends Record<StructDefinitionKey, any>>(options: StructDefinitionOptions<M>): StructDefinitionContext<M>;
    addProperty<K extends StructDefinitionKey, V>(key: K extends keyof T ? never : K, type: TypeDefinition<V>, offset?: number): StructDefinitionContext<Flatten<T & { [X in K]: V }>>;
    addPadding(type: TypeDefinition<any>, offset?: number): StructDefinitionContext<T>;
    updateProperty<K extends keyof T, V>(key: K, type: TypeDefinition<V>, offset?: number): StructDefinitionContext<Flatten<Omit<T, K> & { [P in K]: V }>>;
    removeProperty<K extends keyof T>(key: K): StructDefinitionContext<Flatten<Omit<T, K>>>;
    freeze(): StructDefinitionContext<T>;
    clone(name?: string): StructDefinitionContext<T>;
}

export function defineStruct<T extends Record<StructDefinitionKey, any> = {}>(options: StructDefinitionOptions<T>, customName?: string): StructDefinitionContext<T> {
    let isFreeze = false;
    const testFreeze = (): void => {
        if (isFreeze) {
            throw new Error();
        }
    }
    const updateLayout = () => {
        testFreeze();
        const { propertyList } = typeDefinition;
        const keys = new Array<StructDefinitionKey>;
        const properties = new Map<StructDefinitionKey, StructDefinitionProperty<any>>();
        let maxAlign: number = 1;
        let offset: number = 0;
        for (const property of propertyList) {
            if (!property.padding) {
                keys.push(property.key);
                properties.set(property.key, property);
            }
            // Static offset
            if (typeof property.staticOffset === "number") {
                offset = property.staticOffset;
                property.offset = offset;
                continue;
            }
            // Update max align
            const align = Math.max(property.type.align ?? property.type.size, 1);
            maxAlign = Math.max(maxAlign, align);
            // Padding calculation
            const padding = (align - (offset % align)) % align;
            // Update offset
            offset += padding + property.type.size
            property.offset = offset;
        }
        // End padding
        const endPadding = (maxAlign - (offset % maxAlign)) % maxAlign;
        offset += endPadding;
        // Update
        typeDefinition.maxAlign = maxAlign;
        typeDefinition.size = offset;
        typeDefinition.keys = keys;
        typeDefinition.properties = properties;
        return typeDefinition;
    };
    const setName: StructDefinitionContext<T>["setName"] = (name) => {
        testFreeze();
        typeDefinition.name = name ?? "unknown";
        return typeDefinition;
    };
    const setAlign: StructDefinitionContext<T>["setAlign"] = (align) => {
        testFreeze();
        typeDefinition.align = align;
        return typeDefinition;
    };
    const setLittleEndian: StructDefinitionContext<T>["setLittleEndian"] = (littleEndian) => {
        testFreeze();
        typeDefinition.littleEndian = littleEndian;
        return typeDefinition;
    };
    const setOptions: StructDefinitionContext<T>["setOptions"] = (options) => {
        const orderList: Array<StructDefinitionPropertyOptions<any> & { key: StructDefinitionKey, order: number }> = [];
        const list: Array<StructDefinitionPropertyOptions<any> & { key: StructDefinitionKey }> = [];
        for (const [key, value] of Object.entries(options)) {
            if (isTypeDefinition(value)) {
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
        const mapToProperty = (options: StructDefinitionPropertyOptions<any> & { key: StructDefinitionKey }): StructDefinitionProperty<any> => {
            return {
                key: options.key,
                type: options.type,
                offset: 0,
                staticOffset: options.offset,
                padding: options.padding
            }
        }
        typeDefinition.propertyList = [...orderList.map(mapToProperty), ...list.map(mapToProperty)];
        return updateLayout() as StructDefinitionContext<any>;
    };
    const pushProperty = (property: StructDefinitionProperty<any>): StructDefinitionContext<T> => {
        testFreeze();
        const { properties, propertyList } = typeDefinition;
        // Duplicate Check
        if (properties.has(property.key)) {
            throw new Error();
        }
        // Update
        propertyList.push(property);
        return updateLayout();
    };
    const addProperty: StructDefinitionContext<T>["addProperty"] = (key, type, staticOffset) => pushProperty({
        key: key,
        type: type,
        offset: 0,
        staticOffset
    });
    const addPadding: StructDefinitionContext<T>["addPadding"] = (type, staticOffset) => pushProperty({
        key: Symbol("padding"),
        type: type,
        offset: 0,
        staticOffset,
        padding: true
    });
    const updateProperty: StructDefinitionContext<T>["updateProperty"] = (key, type, staticOffset) => {
        testFreeze();
        const { properties } = typeDefinition;
        const property = properties.get(key as StructDefinitionKey);
        if (!property) {
            throw new Error();
        }
        // Update
        property.type = type;
        property.staticOffset = staticOffset;
        return updateLayout() as StructDefinitionContext<any>;
    };
    const removeProperty: StructDefinitionContext<T>["removeProperty"] = (key) => {
        testFreeze();
        const { propertyList } = typeDefinition;
        const propertyIndex = propertyList.findIndex(property => property.key === key);
        if (propertyIndex < 0) {
            throw new Error();
        }
        // Delete
        propertyList.splice(propertyIndex, 1);
        return updateLayout() as StructDefinitionContext<any>;
    };
    const freeze: StructDefinitionContext<T>["freeze"] = () => {
        isFreeze = true;
        for (const property of typeDefinition.propertyList) {
            Object.freeze(property);
        }
        Object.freeze(typeDefinition.keys);
        Object.freeze(typeDefinition.properties);
        Object.freeze(typeDefinition.propertyList);
        Object.freeze(typeDefinition);
        return typeDefinition;
    };
    const clone: StructDefinitionContext<T>["clone"] = (name) => {
        const newInstance = defineStruct<T>({} as any, name ?? typeDefinition.name);
        newInstance.size = typeDefinition.size;
        newInstance.align = typeDefinition.align;
        newInstance.littleEndian = typeDefinition.littleEndian;
        newInstance.maxAlign = typeDefinition.maxAlign;
        for (const property of typeDefinition.propertyList) {
            newInstance.propertyList.push({
                key: property.key,
                type: property.type,
                offset: property.offset,
                staticOffset: property.staticOffset,
                padding: property.padding
            });
        }
        return newInstance.updateLayout();
    };
    const getter: OperationGetter<T> = ({ view, offset, littleEndian }) => {
        const structure: Record<StructDefinitionKey, any> = {};
        for (const [, property] of typeDefinition.properties) {
            structure[property.key] = property.type.getter({
                view,
                offset: offset + property.offset,
                littleEndian: littleEndian ?? property.type.littleEndian,
            });
        }
        return structure as T;
    };
    const setter: OperationSetter<T> = ({ view, offset, littleEndian }, value) => {
        for (const [, property] of typeDefinition.properties) {
            property.type.setter({
                view,
                offset: offset + property.offset,
                littleEndian: littleEndian ?? property.type.littleEndian,
            }, value[property.key]);
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
        const { properties, keys } = typeDefinition;
        // Used to create property type operation context
        const createContext = (property: StructDefinitionProperty<any>): OperationReactiveContext => {
            const propertyLocalOffset = localOffset + property.offset;
            const propertyContext: OperationReactiveContext = {
                view,
                // Adapt to regular types
                get offset() {
                    return getBaseOffset() + propertyLocalOffset;
                },
                littleEndian: littleEndian ?? property.type.littleEndian,
                localOffset: propertyLocalOffset,
                getBaseOffset
            };
            return propertyContext;
        };
        // Property getter
        const getterMap = new Map<StructDefinitionKey, () => any>();
        const get: ProxyHandler<T>["get"] = (target, key) => {
            let getter = getterMap.get(key);
            if (getter) {
                return getter();
            }
            const property = properties.get(key);
            if (!property) {
                return void 0;
            }
            const propertyContext = createContext(property);
            const propertyGetter = property.type.reactive ?? property.type.getter;
            getter = () => propertyGetter(propertyContext);
            getterMap.set(key, getter);
            return getter();
        };
        // Property setter
        const set: ProxyHandler<T>["set"] = (target, key, value) => {
            const property = properties.get(key);
            if (!property) {
                return false;
            }
            property.type.setter({
                view,
                offset: getBaseOffset() + localOffset + property.offset,
                littleEndian: littleEndian ?? property.type.littleEndian,
            }, value);
            return true;
        };
        const has: ProxyHandler<T>["has"] = (target, key) => {
            return properties.has(key);
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
    const typeDefinition: StructDefinitionContext<T> = {
        [isTypeDefinitionSymbol]: true,
        get name() {
            return name ?? `struct{${typeDefinition.keys.length}}`
        },
        set name(value) {
            testFreeze();
            name = value;
        },
        size: 0,
        get align() {
            return align ?? typeDefinition.maxAlign;
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
        properties: new Map(),
        propertyList: [],
        setName,
        setAlign,
        setLittleEndian,
        updateLayout,
        setOptions,
        addProperty,
        addPadding,
        updateProperty,
        removeProperty,
        freeze,
        clone
    }
    return typeDefinition;
}

export interface ArrayDefinitionContext<T = any> extends TypeDefinition<Array<T>> {
    element: TypeDefinition<T>;
    length: number;
    setName(name: string): ArrayDefinitionContext<T>;
    setAlign(align?: number): ArrayDefinitionContext<T>;
    setLittleEndian(littleEndian?: boolean): ArrayDefinitionContext<T>;
    setElement<M>(type: TypeDefinition<M>): ArrayDefinitionContext<M>;
    setLength(length: number): ArrayDefinitionContext<T>;
    freeze(): ArrayDefinitionContext<T>;
    clone(name?: string): ArrayDefinitionContext<T>;
}

export function defineArray<T>(element: TypeDefinition<T>, length: number, customName?: string): ArrayDefinitionContext<T> {
    let isFreeze = false;
    const testFreeze = (): void => {
        if (isFreeze) {
            throw new Error();
        }
    }
    const setName: ArrayDefinitionContext<T>["setName"] = (name) => {
        testFreeze();
        typeDefinition.name = name ?? "unknown";
        return typeDefinition;
    };
    const setAlign: ArrayDefinitionContext<T>["setAlign"] = (align) => {
        testFreeze();
        typeDefinition.align = align;
        return typeDefinition;
    };
    const setLittleEndian: ArrayDefinitionContext<T>["setLittleEndian"] = (littleEndian) => {
        testFreeze();
        typeDefinition.littleEndian = littleEndian;
        return typeDefinition;
    };
    const setElement: ArrayDefinitionContext<T>["setElement"] = (element: TypeDefinition<any>) => {
        testFreeze();
        typeDefinition.element = element;
        typeDefinition.size = element.size * typeDefinition.length;
        return typeDefinition as ArrayDefinitionContext<any>;
    };
    const setLength: ArrayDefinitionContext<T>["setLength"] = (length) => {
        testFreeze();
        typeDefinition.length = length;
        typeDefinition.size = typeDefinition.element.size * length;
        return typeDefinition;
    };
    const freeze: ArrayDefinitionContext<T>["freeze"] = () => {
        isFreeze = true;
        Object.freeze(typeDefinition);
        return typeDefinition;
    };
    const clone: ArrayDefinitionContext<T>["clone"] = (newName) => {
        const newInstance = defineArray<T>(typeDefinition.element, typeDefinition.length, newName ?? name);
        newInstance.size = typeDefinition.size;
        newInstance.align = typeDefinition.align;
        newInstance.littleEndian = typeDefinition.littleEndian;
        return newInstance;
    };
    const getter: OperationGetter<Array<T>> = ({ view, offset, littleEndian }) => {
        const { element, length } = typeDefinition;
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
        const { element, length } = typeDefinition;
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
        const { element, length } = typeDefinition;
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
        // Built-in properties
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
    const typeDefinition: ArrayDefinitionContext<T> = {
        [isTypeDefinitionSymbol]: true,
        get name() {
            return name ?? `${typeDefinition.element.name}[${typeDefinition.length}]`
        },
        set name(value) {
            testFreeze();
            name = value;
        },
        size: 0,
        get align() {
            return align ?? typeDefinition.element.align;
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
    return typeDefinition;
}
