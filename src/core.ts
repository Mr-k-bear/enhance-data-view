
/**
 * 用于标记类型大小为动态大小
 */
export const DYNAMIC_SIZE = Symbol("DYNAMIC_SIZE");

/**
 * 类型定义对象中数值获取函数
 */
export interface TypeDefinedGetter<T> {
    (view: DataView, offset: number, result: (value: T, size?: number) => void): void;
}

/**
 * 类型描述对象
 */
export interface TypeDefined<T> {
    /**
     * 类型名, 用于调试
     */
    name: string;
    /**
     * 类型大小, 单位: 字节, 默认: DYNAMIC_SIZE
     */
    size: number | typeof DYNAMIC_SIZE;
    /**
     * 数值计算函数
     */
    getter: TypeDefinedGetter<T>;
}

/**
 * 从类型定义中提取类型
 */
export type TypeDefinedInfer<T extends TypeDefined<any>> = T extends TypeDefined<infer W> ? W : unknown;

/**
 * 类型定义上下文
 */
export interface TypeDefinedContext<T> extends TypeDefined<T> {
    /**
     * 设置类型名称
     */
    setName(name: string): TypeDefinedContext<T>;
    n: TypeDefinedContext<T>["setName"];
    /**
     * 设置类型大小
     */
    setSize(size: number | typeof DYNAMIC_SIZE): TypeDefinedContext<T>;
    s: TypeDefinedContext<T>["setSize"];
    /**
     * 设置计算函数
     */
    setGetter(getter: TypeDefinedGetter<T>): TypeDefinedContext<T>;
    g: TypeDefinedContext<T>["setGetter"];
}

/**
 * 定义类型
 */
export function definedType<T = unknown>(name?: string): TypeDefinedContext<T> {
    const setName = (name: string) => {
        context.name = name || context.name;
        return context;
    }
    const setSize = (size: number | typeof DYNAMIC_SIZE) => {
        context.size = size;
        return context;
    }
    const setGetter = (getter: TypeDefinedGetter<T>) => {
        context.getter = getter;
        return context;
    }
    const context: TypeDefinedContext<T> = {
        name: name || "Unknown",
        size: DYNAMIC_SIZE,
        getter: () => { },
        setName,
        n: setName,
        setSize,
        s: setSize,
        setGetter,
        g: setGetter
    };
    return context;
}

// 用于强制触发 TypeScript 类型简化, 无实际作用
type Flatten<T> = {} & { [K in keyof T]: T[K] };

/**
 * 结构体定义允许的键值类型
 */
export type StructDefinedkey = string | number | symbol;

/**
 * 结构体属性定义记录
 */
export interface StructDefinedProperty {
    /**
     * 属性键
     */
    key: StructDefinedkey;
    /**
     * 属性类型
     */
    type: TypeDefined<any>;
    /**
     * 内存对齐数量, 默认: 1
     * 设置此值会覆盖整个结构体默认的对齐值
     */
    align?: number;
    /**
     * 属性地址偏移量, 默认: 0
     */
    offset?: number;
    /**
     * 偏移量是否为绝对值, 默认: false
     * false: 属性相对于上一属性地址的偏移量
     * true: 属性相对于整个结构体地址的偏移量
     */
    absolute?: boolean;
}

/**
 * 类型定义上下文
 */
export interface StructDefinedContext<T extends Record<StructDefinedkey, any>> extends TypeDefined<T> {
    /**
     * 结构体默认对齐值, 默认: 1
     */
    align: number;
    /**
     * 结构体属性列表
     */
    properties: Array<StructDefinedProperty>;
    /**
     * 设置结构体名称
     */
    setName(name: string): StructDefinedContext<T>;
    n(name: string): StructDefinedContext<T>;
    /**
     * 设置结构体默认对齐值
     */
    setAlign(align: number): StructDefinedContext<T>;
    a(align: number): StructDefinedContext<T>;
    /**
     * 添加结构体属性
     */
    addProperty<K extends StructDefinedkey, V>(key: K, type: TypeDefined<V>, options?: Omit<StructDefinedProperty, "key" | "type">): StructDefinedContext<Flatten<T & { [X in K]: V }>>;
    p: StructDefinedContext<T>["addProperty"];
}

/**
 * 定义结构体类型
 */
export function definedStructure<T extends Record<StructDefinedkey, any> = {}>(name?: string): StructDefinedContext<T> {
    const setName = (name: string) => {
        context.name = name || context.name;
        return context;
    }
    const setAlign = (align: number) => {
        context.align = align;
        return context;
    }
    // 计算属性偏移量
    const getOffset = (offset: number, property: StructDefinedProperty): number => {
        const propertyOffset = property.offset ?? 0;
        // 处理绝对偏移
        if (property.absolute) {
            return propertyOffset;
        }
        // 计算偏移量
        let alignedOffset: number;
        const align = property.align ?? context.align;
        const remainder = offset % align;
        if (remainder === 0) {
            alignedOffset = offset;
        }
        else {
            const padding = align - remainder;
            alignedOffset = offset + padding;
        }
        // 相对偏移
        alignedOffset += propertyOffset;
        return alignedOffset;
    }
    const addProperty = <K extends StructDefinedkey, V>(key: K, type: TypeDefined<V>, options?: Omit<StructDefinedProperty, "key" | "type">) => {
        const property: StructDefinedProperty = {
            key: key,
            type: type,
            align: options?.align,
            offset: options?.offset,
            absolute: options?.absolute
        };
        context.properties.push(property);
        // 更新结构体大小
        if (type.size === DYNAMIC_SIZE) {
            context.size = DYNAMIC_SIZE;
        }
        else if (context.size !== DYNAMIC_SIZE) {
            context.size = getOffset(context.size, property) + type.size;
        }
        return context;
    }
    const getter: TypeDefinedGetter<T> = (view, offset, result) => {
        const structure: Record<StructDefinedkey, any> = {};
        let currentOffset = 0;
        let tempValue: any;
        let tempSize: number | undefined;
        const resultCallback = (value: any, size?: number) => {
            tempValue = value;
            tempSize = size;
        }
        for (const record of context.properties) {
            currentOffset = getOffset(currentOffset, record);
            record.type.getter(view, offset + currentOffset, resultCallback);
            structure[record.key] = tempValue;
            if (record.type.size === DYNAMIC_SIZE) {
                if (tempSize === void 0) {
                    throw new Error(
                        `${record.type.name}: The dynamic size type must return its actual size in the callback function.`
                    );
                }
                else {
                    currentOffset += tempSize;
                }
            }
            else {
                currentOffset += record.type.size;
            }
        }
    }
    const context: StructDefinedContext<T> = {
        name: name || "Unknown",
        size: DYNAMIC_SIZE,
        align: 1,
        properties: [],
        getter: () => { },
        setName,
        n: setName,
        setAlign,
        a: setAlign,
        addProperty,
        p: addProperty
    };
    return context;
}

const S = definedType<string>();
const N = definedType<number>();
const A = definedType<{}>();
const Q = definedStructure().addProperty("foo", S).p("bar", N).p(1, A);