import { TypeDefinitionSymbol, OperationRawSymbol, isTypeDefinition } from "./core";
import type { OperationGetter, OperationSetter, OperationReactive } from "./core";
import type { TypeDefinition, OperationContextDynamic } from "./core";

export type Flatten<T> = {} & { [K in keyof T]: T[K] };

export type StructKey = string | symbol;

export const PropertyDefinitionSymbol = Symbol("PROPERTY_DEFINITION");

export interface PropertyDefinition<T> {
    isPropertyDefinition: typeof PropertyDefinitionSymbol;
    type: TypeDefinition<T>;
    align?: number;
    offset?: number;
    order?: number;
}

export function defineProperty<T>(type: TypeDefinition<T>, options?: { align?: number, offset?: number, order?: number }): PropertyDefinition<T> {
    return {
        isPropertyDefinition: PropertyDefinitionSymbol,
        type,
        align: options?.align,
        offset: options?.offset,
        order: options?.order
    }
}

export function isPropertyDefinition(test: any): test is PropertyDefinition<any> {
    if (typeof test !== "object" || test === null) {
        return false;
    }
    if (test.isPropertyDefinition === PropertyDefinitionSymbol) {
        return true;
    }
    return false;
}

export const PaddingDefinitionSymbol = Symbol("STRUCT_DEFINITION");

export interface PaddingDefinition<T extends typeof PaddingDefinitionSymbol = typeof PaddingDefinitionSymbol> {
    isPaddingDefinition: T;
    size: number;
    align: number;
    offset?: number;
    order?: number;
}

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

export function isPaddingDefinition(test: any): test is PaddingDefinition {
    if (typeof test !== "object" || test === null) {
        return false;
    }
    if (test.isPaddingDefinition === PaddingDefinitionSymbol) {
        return true;
    }
    return false;
}

export type StructDefinitionOptions<T extends Record<StructKey, any | never>> = {
    [K in keyof T]: PropertyDefinition<T[K]> | PaddingDefinition<T[K]> | TypeDefinition<T[K]>;
};

export type MapPaddingDefinition<T extends Record<StructKey, any>> = { [K in keyof T]: T[K] extends typeof PaddingDefinitionSymbol ? void : T[K] };

export interface PropertyRecord {
    key: StructKey;
    type: TypeDefinition<any>;
    align?: number;
    offset: number;
    offsetStatic?: number;
    padding?: false;
}

export interface PaddingRecord {
    key: StructKey;
    size: number;
    align: number;
    offset: number;
    offsetStatic?: number;
    padding: true;
}

export interface StructDefinitionFreezed<T extends Record<StructKey, any>> extends TypeDefinition<T> {
    keys: ReadonlyArray<StructKey>;
    properties: ReadonlyMap<StructKey, PropertyRecord>;
    propertyList: ReadonlyArray<PropertyRecord>;
    recordList: ReadonlyArray<PropertyRecord | PaddingRecord>;
    clone(name?: string): StructDefinition<T>;
}

export interface StructDefinition<T extends Record<StructKey, any>> extends StructDefinitionFreezed<T> {
    setName(name?: string): StructDefinition<T>;
    setSize(size?: number): StructDefinition<T>;
    setAlign(align?: number): StructDefinition<T>;
    setProperties<M extends Record<StructKey, any>>(options: StructDefinitionOptions<M>): StructDefinition<Flatten<MapPaddingDefinition<M>>>;
    addProperty<K extends StructKey, V>(key: K extends keyof T ? never : K, type: TypeDefinition<V>, options?: { align?: number, offset?: number }): StructDefinition<Flatten<T & { [X in K]: V }>>;
    addPadding<K extends StructKey>(key: K extends keyof T ? never : K, typeOrSize: TypeDefinition<any> | number, options?: { align?: number, offset?: number }): StructDefinition<Flatten<T & { [X in K]: void }>>;
    updateProperty<K extends keyof T, V>(key: K, type: TypeDefinition<V>, options?: { align?: number, offset?: number }): StructDefinition<Flatten<Omit<T, K> & { [P in K]: V }>>;
    updatePadding<K extends keyof T>(key: K, typeOrSize: TypeDefinition<any> | number, options?: { align?: number, offset?: number }): StructDefinition<Flatten<Omit<T, K> & { [P in K]: void }>>;
    remove<K extends keyof T>(key: K): StructDefinition<Flatten<Omit<T, K>>>;
    freeze(): StructDefinitionFreezed<T>;
}

export function defineStruct(name?: string): StructDefinition<{}>;
export function defineStruct<T extends Record<StructKey, any>>(options: StructDefinitionOptions<T>, name?: string): StructDefinition<Flatten<MapPaddingDefinition<T>>>;
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
                throw new Error();
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
            throw new Error();
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
            throw new Error();
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
            throw new Error();
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
    const clone: StructDefinition<T>["clone"] = (name) => defineStruct(name ?? _name)
        .setSize(_size)
        .setAlign(_align)
        .setProperties(getProperties()) as any;
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
        const toRaw = () => typeDefinition.getter({
            view,
            offset: baseOffset() + localOffset,
            littleEndian
        });
        const internal = new Map<string | symbol, any>([
            [OperationRawSymbol, toRaw]
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
