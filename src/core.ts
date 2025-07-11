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

export interface TypeDefinition<T> {
    name: string;
    size: number;
    align?: number;
    littleEndian?: boolean;
    getter: OperationGetter<T>;
    setter: OperationSetter<T>;
    reactive?: OperationReactive<T>;
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

export interface StructDefinitionContext<T extends Record<StructDefinitionKey, any>> extends TypeDefinition<T> {
    maxAlign: number;
    keys: ReadonlyArray<StructDefinitionKey>;
    properties: ReadonlyMap<StructDefinitionKey, StructDefinitionProperty<any>>;
    propertyList: Array<StructDefinitionProperty<any>>;
    setName(name: string): StructDefinitionContext<T>;
    setAlign(align?: number): StructDefinitionContext<T>;
    setLittleEndian(littleEndian?: boolean): StructDefinitionContext<T>;
    updateLayout(): StructDefinitionContext<T>;
    addProperty<K extends StructDefinitionKey, V>(key: K extends keyof T ? never : K, type: TypeDefinition<V>, offset?: number): StructDefinitionContext<Flatten<T & { [X in K]: V }>>;
    addPadding(type: TypeDefinition<any>, offset?: number): StructDefinitionContext<T>;
    updateProperty<K extends keyof T, V>(key: K, type: TypeDefinition<V>, offset?: number): StructDefinitionContext<Flatten<Omit<T, K> & { [P in K]: V }>>;
    removeProperty<K extends keyof T>(key: K): StructDefinitionContext<Flatten<Omit<T, K>>>;
    freeze(): StructDefinitionContext<T>;
    clone(name?: string): StructDefinitionContext<T>;
}

export function defineStruct<T extends Record<StructDefinitionKey, any> = {}>(name?: string): StructDefinitionContext<T> {
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
        const newInstance = defineStruct<T>(name ?? typeDefinition.name);
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
        const createPropertyContext = (property: StructDefinitionProperty<any>): OperationReactiveContext => {
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
            const propertyContext = createPropertyContext(property);
            const propertyGetter = property.type.reactive ?? property.type.getter;
            getter = () => propertyGetter(propertyContext);
            getterMap.set(key, getter);
            return getter();
        };
        // Property setter
        const setterMap = new Map<StructDefinitionKey, (value: any) => void>();
        const set: ProxyHandler<T>["set"] = (target, key, value) => {
            let setter = setterMap.get(key);
            if (setter) {
                setter(value);
                return true;
            }
            const property = properties.get(key);
            if (!property) {
                return false;
            }
            const propertyContext = createPropertyContext(property);
            const propertySetter = property.type.setter;
            setter = (newValue) => propertySetter(propertyContext, newValue);
            setterMap.set(key, setter);
            setter(value);
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
    let align: number | undefined;
    const typeDefinition: StructDefinitionContext<T> = {
        name: name ?? "unknown",
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
        addProperty,
        addPadding,
        updateProperty,
        removeProperty,
        freeze,
        clone
    }
    return typeDefinition;
}