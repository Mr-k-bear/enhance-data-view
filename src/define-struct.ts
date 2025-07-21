import { TypeDefinitionSymbol, OperationRawSymbol, isTypeDefinition } from "./core";
import type { OperationGetter, OperationSetter, OperationReactive } from "./core";
import type { TypeDefinition, OperationContextDynamic } from "./core";

/**
 * Utility type to force TypeScript to simplify complex types
 * @template T - Type to flatten
 */
export type Flatten<T> = {} & { [K in keyof T]: T[K] };

/** Valid key types for struct properties */
export type StructKey = string | symbol;

/** Unique symbol identifying property definitions */
export const PropertyDefinitionSymbol = Symbol("PROPERTY_DEFINITION");

/**
 * Defines a struct property configuration
 * @template T - JavaScript type of the property
 */
export interface PropertyDefinition<T> {
    /** Property identification marker */
    isPropertyDefinition: typeof PropertyDefinitionSymbol;
    /** Type definition for the property */
    type: TypeDefinition<T>;
    /** 
     * Custom alignment override 
     * @remarks Takes precedence over the type's natural alignment
     */
    align?: number;
    /** 
     * Fixed byte offset override
     * @remarks Bypasses automatic layout calculation
     */
    offset?: number;
    /** 
     * Explicit ordering index
     * @remarks Determines position in struct layout when set
     */
    order?: number;
}

/**
 * Creates a property definition
 * @param type - Property type definition
 * @param options - Configuration options
 * @returns Property definition object
 * @example 
 * defineProperty(Uint32, { align: 8, offset: 0x10 })
 */
export function defineProperty<T>(type: TypeDefinition<T>, options?: { align?: number, offset?: number, order?: number }): PropertyDefinition<T> {
    return {
        isPropertyDefinition: PropertyDefinitionSymbol,
        type,
        align: options?.align,
        offset: options?.offset,
        order: options?.order
    }
}

/** Type guard for property definitions */
export function isPropertyDefinition(test: any): test is PropertyDefinition<any> {
    if (typeof test !== "object" || test === null) {
        return false;
    }
    if (test.isPropertyDefinition === PropertyDefinitionSymbol) {
        return true;
    }
    return false;
}

/** Unique symbol identifying padding definitions */
export const PaddingDefinitionSymbol = Symbol("STRUCT_DEFINITION");

/**
 * Defines padding within a struct
 * @template T - Padding symbol type (internal)
 */
export interface PaddingDefinition<T extends typeof PaddingDefinitionSymbol = typeof PaddingDefinitionSymbol> {
    /** Padding identification marker */
    isPaddingDefinition: T;
    /** Padding size in bytes */
    size: number;
    /** Padding alignment requirement */
    align: number;
    /** 
     * Fixed byte offset override
     * @remarks Bypasses automatic layout calculation
     */
    offset?: number;
    /** 
     * Explicit ordering index
     * @remarks Determines position in struct layout when set
     */
    order?: number;
}

/**
 * Creates a padding definition
 * @param typeOrSize - Type definition or byte size
 * @param options - Configuration options
 * @returns Padding definition object
 * @example 
 * // 8-byte padding with 4-byte alignment
 * definePadding(8, { align: 4 })
 */
export function definePadding(typeOrSize: TypeDefinition<any> | number, options?: { align?: number, offset?: number, order?: number }): PaddingDefinition {
    return typeof typeOrSize === "number" ? {
        isPaddingDefinition: PaddingDefinitionSymbol,
        size: typeOrSize,
        align: options?.align ?? 1,
        offset: options?.offset,
        order: options?.order
    } : {
        isPaddingDefinition: PaddingDefinitionSymbol,
        size: typeOrSize.size,
        align: options?.align ?? typeOrSize.align,
        offset: options?.offset,
        order: options?.order
    };
}

/** Type guard for padding definitions */
export function isPaddingDefinition(test: any): test is PaddingDefinition {
    if (typeof test !== "object" || test === null) {
        return false;
    }
    if (test.isPaddingDefinition === PaddingDefinitionSymbol) {
        return true;
    }
    return false;
}

/**
 * Configuration object for struct properties
 * @template T - Struct shape mapping keys to types
 */
export type StructDefinitionOptions<T extends Record<StructKey, any | never>> = {
    [K in keyof T]: PropertyDefinition<T[K]> | PaddingDefinition<T[K]> | TypeDefinition<T[K]>;
};

/**
 * Maps padding definitions to void in struct types
 * @template T - Original struct type mapping
 */
export type MapPaddingDefinition<T extends Record<StructKey, any>> = { [K in keyof T]: T[K] extends typeof PaddingDefinitionSymbol ? void : T[K] };

/** Calculated property layout information */
export interface PropertyRecord {
    /** Property key */
    key: StructKey;
    /** Property type definition */
    type: TypeDefinition<any>;
    /** Effective alignment */
    align?: number;
    /** Calculated byte offset */
    offset: number;
    /** Original static offset if provided */
    offsetStatic?: number;
    /** Padding marker (false for properties) */
    padding?: false;
}

/** Calculated padding layout information */
export interface PaddingRecord {
    /** Padding identifier key */
    key: StructKey;
    /** Padding size in bytes */
    size: number;
    /** Effective alignment */
    align: number;
    /** Calculated byte offset */
    offset: number;
    /** Original static offset if provided */
    offsetStatic?: number;
    /** Padding marker (true) */
    padding: true;
}

/**
 * Immutable struct type definition (frozen state)
 * @template T - Struct shape
 */
export interface StructDefinitionFreezed<T extends Record<StructKey, any>> extends TypeDefinition<T> {
    /** Array of property keys (excluding padding) */
    keys: ReadonlyArray<StructKey>;
    /** Map of property records (excluding padding) */
    properties: ReadonlyMap<StructKey, PropertyRecord>;
    /** Array of property records (excluding padding) */
    propertyList: ReadonlyArray<PropertyRecord>;
    /** Complete layout records (properties + padding) */
    recordList: ReadonlyArray<PropertyRecord | PaddingRecord>;
    /**
     * Creates a mutable clone
     * @param name - Optional new name for cloned definition
     * @returns Mutable struct definition
     */
    clone(name?: string): StructDefinition<T>;
}

/**
 * Mutable struct type definition with chainable API
 * @template T - Struct shape
 * @remarks 
 * - Supports dynamic property management
 * - Performs automatic memory layout calculation
 */
export interface StructDefinition<T extends Record<StructKey, any>> extends StructDefinitionFreezed<T> {
    /**
     * Sets struct name
     * @param name - New struct name
     * @returns Current instance for chaining
     */
    setName(name?: string): StructDefinition<T>;
    /**
     * Sets fixed struct size
     * @param size - Byte size override
     * @returns Current instance for chaining
     * @remarks Bypasses automatic size calculation
     */
    setSize(size?: number): StructDefinition<T>;
    /**
     * Sets struct alignment
     * @param align - Alignment requirement
     * @returns Current instance for chaining
     * @remarks Overrides automatic alignment detection
     */
    setAlign(align?: number): StructDefinition<T>;
    /**
     * Replaces all properties
     * @param options - New property configuration
     * @returns Current struct definition with updated type
     * @template M - New struct shape
     */
    setProperties<M extends Record<StructKey, any>>(options: StructDefinitionOptions<M>): StructDefinition<Flatten<MapPaddingDefinition<M>>>;
    /**
     * Adds new property
     * @param key - Property key (must not exist)
     * @param type - Property type definition
     * @param options - Configuration options
     * @returns Current struct definition with extended type
     * @template K - New property key
     * @template V - New property value type
     */
    addProperty<K extends StructKey, V>(key: K extends keyof T ? never : K, type: TypeDefinition<V>, options?: { align?: number, offset?: number }): StructDefinition<Flatten<T & { [X in K]: V }>>;
    /**
     * Adds padding region
     * @param key - Padding identifier key (must not exist)
     * @param typeOrSize - Type definition or byte size
     * @param options - Configuration options
     * @returns Current struct definition with extended type
     * @template K - New padding key
     */
    addPadding<K extends StructKey>(key: K extends keyof T ? never : K, typeOrSize: TypeDefinition<any> | number, options?: { align?: number, offset?: number }): StructDefinition<Flatten<T & { [X in K]: void }>>;
    /**
     * Updates existing property
     * @param key - Existing property key
     * @param type - New type definition
     * @param options - Configuration options
     * @returns Current struct definition with updated type
     * @remarks
     * - Maintains original property position in layout
     * - Converts padding to property if key was padding
     * - Preserves all other properties unchanged
     * - Ideal for generic struct configurations
     * @template K - Property key to update
     * @template V - New property type
     */
    updateProperty<K extends keyof T, V>(key: K, type: TypeDefinition<V>, options?: { align?: number, offset?: number }): StructDefinition<Flatten<Omit<T, K> & { [P in K]: V }>>;
    /**
     * Updates existing padding
     * @param key - Existing property key
     * @param typeOrSize - Type definition or byte size
     * @param options - Configuration options
     * @returns Current struct definition with updated type
     * @remarks
     * - Maintains original position in layout
     * - Converts property to padding if key was property
     * - Preserves all other properties unchanged
     * - Padding keys become void in type system
     * @template K - Property key to update
     */
    updatePadding<K extends keyof T>(key: K, typeOrSize: TypeDefinition<any> | number, options?: { align?: number, offset?: number }): StructDefinition<Flatten<Omit<T, K> & { [P in K]: void }>>;
    /**
     * Removes property/padding
     * @param key - Key to remove
     * @returns New struct definition with reduced type
     * @template K - Key to remove
     */
    remove<K extends keyof T>(key: K): StructDefinition<Flatten<Omit<T, K>>>;
    /**
     * Freezes the type definition to prevent modification
     * @returns Immutable version of the type definition
     * @remarks 
     * - Improves performance by preventing runtime changes
     * - Should be called after final configuration
     * @example 
     * const finalType = mutableType.freeze();
     */
    freeze(): StructDefinitionFreezed<T>;
}

/**
 * Creates a configurable struct type definition
 * @overload
 * @param name - Struct name
 * @returns Empty struct definition
 */
export function defineStruct(name?: string): StructDefinition<{}>;
/**
 * Creates a configurable struct type definition
 * @overload
 * @param options - Initial property configuration
 * @param name - Optional struct name
 * @returns Configured struct definition
 * @template T - Initial struct shape
 */
export function defineStruct<T extends Record<StructKey, any>>(options: StructDefinitionOptions<T>, name?: string): StructDefinition<Flatten<MapPaddingDefinition<T>>>;
/**
 * Struct definition implementation
 * @param param0 - Options object or name
 * @param param1 - Optional name
 * @returns Struct definition instance
 */
export function defineStruct<T extends Record<StructKey, any> = {}>(param0?: StructDefinitionOptions<T> | string, param1?: string): StructDefinition<Flatten<MapPaddingDefinition<T>>> {
    let _name: string | undefined;
    let _size: number | undefined;
    let _sizeCalc: number = 0;
    let _align: number | undefined;
    let _alignCalc: number = 1;
    let _keys: ReadonlyArray<StructKey> = new Array();
    let _properties: ReadonlyMap<StructKey, PropertyRecord> = new Map();
    let _propertyList: ReadonlyArray<PropertyRecord> = new Array();
    let _recordList: Array<PropertyRecord | PaddingRecord> = new Array();
    const setName: StructDefinition<T>["setName"] = (name) => {
        _name = name;
        return typeDefinition;
    };
    const setSize: StructDefinition<T>["setSize"] = (size) => {
        _size = size;
        return typeDefinition;
    };
    const setAlign: StructDefinition<T>["setAlign"] = (align) => {
        _align = align;
        return typeDefinition;
    };
    const updateLayout = (): StructDefinition<T> => {
        const keys = new Array<StructKey>();
        const properties = new Map<StructKey, PropertyRecord>();
        const propertyList = new Array<PropertyRecord>();
        let maxAlign: number = 1;
        let maxOffset: number = 0;
        let offset: number = 0;
        for (const record of _recordList) {
            // Get size, align
            let size: number;
            let align: number;
            if (record.padding) {
                size = record.size;
                align = Math.max(record.align, 1);
            }
            else {
                size = record.type.size;
                align = Math.max(record.align ?? record.type.align, 1);
                // Record to map
                keys.push(record.key);
                properties.set(record.key, record);
                propertyList.push(record);
            }
            // Static offset
            const offsetStatic = record.offsetStatic;
            if (typeof offsetStatic === "number") {
                record.offset = offsetStatic;
                offset = offsetStatic + size;
            }
            else {
                // Padding calculation
                const padding = (align - (offset % align)) % align;
                // Update
                offset += padding;
                record.offset = offset;
                offset += size;
            }
            maxAlign = Math.max(maxAlign, align);
            maxOffset = Math.max(maxOffset, offset);
        }
        // End padding
        const endPadding = (maxAlign - (maxOffset % maxAlign)) % maxAlign;
        // Update
        _alignCalc = maxAlign;
        _sizeCalc = maxOffset + endPadding;
        _keys = keys;
        _properties = properties;
        _propertyList = propertyList;
        return typeDefinition;
    };
    const propertyToRecord = <T>(key: StructKey, definition: PropertyDefinition<T>): PropertyRecord => ({
        key,
        type: definition.type,
        align: definition.align,
        offset: 0,
        offsetStatic: definition.offset
    });
    const paddingToRecord = (key: StructKey, definition: PaddingDefinition): PaddingRecord => ({
        key,
        size: definition.size,
        align: definition.align,
        offset: 0,
        offsetStatic: definition.offset,
        padding: true
    });
    const setProperties: StructDefinition<T>["setProperties"] = (options) => {
        const orderList: Array<{ order: number, property: PropertyRecord | PaddingRecord }> = [];
        const list: Array<PropertyRecord | PaddingRecord> = [];
        for (const [key, option] of Object.entries(options)) {
            // Pure type
            if (isTypeDefinition(option)) {
                list.push({
                    key,
                    type: option,
                    offset: 0
                });
                continue;
            }
            let property: PropertyRecord | PaddingRecord;
            if (isPropertyDefinition(option)) {
                property = propertyToRecord(key, option);
            }
            else if (isPaddingDefinition(option)) {
                property = paddingToRecord(key, option);
            }
            else {
                throw new Error(`[${typeDefinition.name}] Unknown option type.`);
            }
            if (typeof option.order === "number") {
                orderList.push({
                    order: option.order,
                    property,
                });
            }
            else {
                list.push(property);
            }
        }
        // Sort by order
        orderList.sort((a, b) => a.order - b.order);
        // Update
        _recordList = orderList.map(x => x.property).concat(list);
        return updateLayout() as any;
    };
    const getProperties = (): StructDefinitionOptions<T> => {
        let order = 0;
        const options: Record<StructKey, PropertyDefinition<any> | PaddingDefinition> = {};
        for (const record of _recordList) {
            let option: PropertyDefinition<any> | PaddingDefinition;
            const definitionOption = {
                align: record.align,
                offset: record.offsetStatic,
                order: order++
            };
            if (record.padding) {
                option = definePadding(record.size, definitionOption);
            }
            else {
                option = defineProperty(record.type, definitionOption);
            }
            options[record.key] = option;
        }
        return options as StructDefinitionOptions<T>;
    };
    const addRecord = (property: PropertyRecord | PaddingRecord): StructDefinition<T> => {
        // Duplicate Check
        if (_recordList.find(x => x.key === property.key)) {
            const keyString = typeof property.key === "symbol" ? `Symbol(${property.key.description || ""})` : property.key;
            throw new Error(`[${typeDefinition.name}] Repeat adding records with key: ${keyString}`);
        }
        // Update
        _recordList.push(property);
        return updateLayout();
    };
    const addProperty: StructDefinition<T>["addProperty"] = (key, type, options) => {
        return addRecord(propertyToRecord(key, defineProperty(type, options)));
    };
    const addPadding: StructDefinition<T>["addPadding"] = (key, typeOrSize, options) => {
        return addRecord(paddingToRecord(key, definePadding(typeOrSize, options)));
    };
    const updateRecord = (property: PropertyRecord | PaddingRecord): StructDefinition<T> => {
        const index = _recordList.findIndex(x => x.key === property.key);
        if (index < 0) {
            const keyString = typeof property.key === "symbol" ? `Symbol(${property.key.description || ""})` : property.key;
            throw new Error(`[${typeDefinition.name}] There is no record with key: ${keyString}`);
        }
        // Update
        _recordList.splice(index, 1, property);
        return updateLayout();
    };
    const updateProperty: StructDefinition<T>["updateProperty"] = (key, type, options) => {
        return updateRecord(propertyToRecord(key as StructKey, defineProperty(type, options))) as any;
    };
    const updatePadding: StructDefinition<T>["updatePadding"] = (key, typeOrSize, options) => {
        return updateRecord(paddingToRecord(key as StructKey, definePadding(typeOrSize, options))) as any;
    };
    const remove: StructDefinition<T>["remove"] = (key) => {
        const index = _recordList.findIndex(x => x.key === key);
        if (index < 0) {
            const keyString = typeof key === "symbol" ? `Symbol(${key.description || ""})` : key as string;
            throw new Error(`[${typeDefinition.name}] There is no record with key: ${keyString}`);
        }
        // Delete
        _recordList.splice(index, 1);
        return updateLayout() as any;
    };
    const freeze: StructDefinition<T>["freeze"] = () => {
        const newDefinition = clone();
        return Object.freeze({
            isTypeDefinition: TypeDefinitionSymbol,
            name: newDefinition.name,
            size: newDefinition.size,
            align: newDefinition.align,
            keys: Object.freeze(newDefinition.keys),
            properties: Object.freeze(newDefinition.properties),
            propertyList: Object.freeze(newDefinition.propertyList),
            recordList: Object.freeze(newDefinition.recordList),
            getter: newDefinition.getter,
            setter: newDefinition.setter,
            reactive: newDefinition.reactive,
            clone: newDefinition.clone
        });
    };
    const clone: StructDefinition<T>["clone"] = (name) => defineStruct(getProperties(), name ?? _name)
        .setSize(_size)
        .setAlign(_align) as any;
    const getter: OperationGetter<T> = ({ view, offset, littleEndian }) => {
        const structure: Record<StructKey, any> = {};
        for (const property of _propertyList) {
            structure[property.key] = property.type.getter({
                view,
                offset: offset + property.offset,
                littleEndian: littleEndian,
            });
        }
        return structure as T;
    };
    const setter: OperationSetter<T> = ({ view, offset, littleEndian }, value) => {
        for (const property of _propertyList) {
            property.type.setter({
                view,
                offset: offset + property.offset,
                littleEndian: littleEndian,
            }, value[property.key]);
        }
    };
    const reactive: OperationReactive<T> = ({ view, littleEndian, localOffset, baseOffset, cacheGetter }) => {
        const proxyToRaw = () => typeDefinition.getter({
            view,
            offset: baseOffset() + localOffset,
            littleEndian
        });
        const internal = new Map<string | symbol, any>([
            [OperationRawSymbol, proxyToRaw]
        ]);
        // Prop getter
        const getterMap = new Map<StructKey, () => any>();
        const get: ProxyHandler<T>["get"] = (target, key) => {
            let getter = getterMap.get(key);
            if (getter) {
                return getter();
            }
            const property = _properties.get(key);
            if (property) {
                const context: OperationContextDynamic = {
                    view,
                    littleEndian,
                    localOffset: localOffset + property.offset,
                    baseOffset,
                    cacheGetter: getter => getterMap.set(property.key, getter)
                };
                getter = () => property.type.reactive(context);
                getterMap.set(property.key, getter);
                return getter();
            }
            else {
                return internal.get(key);
            }
        };
        // Prop setter
        const set: ProxyHandler<T>["set"] = (target, key, value) => {
            const property = _properties.get(key);
            if (property) {
                property.type.setter({
                    view,
                    offset: baseOffset() + localOffset + property.offset,
                    littleEndian
                }, value);
                return true;
            }
            else {
                return false;
            }
        };
        const has: ProxyHandler<T>["has"] = (target, key) => {
            return _properties.has(key);
        };
        const ownKeys: ProxyHandler<T>["ownKeys"] = () => {
            return _keys;
        };
        const defineProperty: ProxyHandler<T>["defineProperty"] = () => false;
        const deleteProperty: ProxyHandler<T>["deleteProperty"] = () => false;
        const proxy = new Proxy({} as T, {
            get,
            set,
            has,
            ownKeys,
            defineProperty,
            deleteProperty
        });
        cacheGetter(() => proxy);
        return proxy;
    }
    const typeDefinition: StructDefinition<T> = {
        isTypeDefinition: TypeDefinitionSymbol,
        get name() {
            return _name ?? `struct{${_keys.length}}`;
        },
        get size() {
            return Math.max(_size ?? _sizeCalc, 0);
        },
        get align() {
            return Math.max(_align ?? _alignCalc, 1);
        },
        get keys() {
            return _keys;
        },
        get properties() {
            return _properties;
        },
        get propertyList() {
            return _propertyList;
        },
        get recordList() {
            return _recordList;
        },
        getter,
        setter,
        reactive,
        setName,
        setSize,
        setAlign,
        setProperties,
        addProperty,
        addPadding,
        updateProperty,
        updatePadding,
        remove,
        freeze,
        clone
    }
    if (typeof param0 === "object") {
        setProperties(param0);
        setName(param1);
    }
    else {
        setName(param0);
    }
    return typeDefinition as any;
}
