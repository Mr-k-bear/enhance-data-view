
/**
 * Context object received during generic type operations (read/write)
 */
export interface OperationContext {
    /** DataView instance for current operation */
    view: DataView;
    /** Byte offset for current operation */
    offset: number;
    /** Whether to use little-endian byte order */
    littleEndian?: boolean;
}

/**
 * Context object for reactive conversion operations
 */
export interface OperationContextDynamic {
    /** DataView instance for current operation */
    view: DataView;
    /** Whether to use little-endian byte order */
    littleEndian?: boolean;
    /** Offset relative to operation start position */
    localOffset: number;
    /**
     * Base offset getter for read operations
     * @remarks Supports dynamic starting positions in reactive mode
     */
    baseOffset: () => number;
    /**
     * Caches getter function for performance optimization
     * @param getter - Function to cache for subsequent reads
     */
    cacheGetter: (getter: () => any) => void;
}

/** Function signature for type definition read operations */
export type OperationGetter<T> = (this: TypeDefinition<T>, context: OperationContext) => T;

/** Function signature for type definition write operations */
export type OperationSetter<T> = (this: TypeDefinition<T>, context: OperationContext, value: T) => void;

/** Function signature for reactive object conversion */
export type OperationReactive<T> = (this: TypeDefinition<T>, context: OperationContextDynamic) => T;

/** Unique symbol identifying type definition objects */
export const TypeDefinitionSymbol = Symbol("TYPE_DEFINITION");

/**
 * Describes a binary data type definition
 * @template T - JavaScript type represented by this definition
 */
export interface TypeDefinition<T> {
    /** Type identification marker */
    isTypeDefinition: typeof TypeDefinitionSymbol;
    /** Type name for debugging purposes */
    name: string;
    /** Type size in bytes */
    size: number;
    /** Alignment requirement for memory layout calculations */
    align: number;
    /** Read operation implementation */
    getter: OperationGetter<T>;
    /** Write operation implementation */
    setter: OperationSetter<T>;
    /** Reactive conversion implementation */
    reactive: OperationReactive<T>;
}

/**
 * Type guard for TypeDefinition objects
 * @param test - Value to check
 * @returns Whether the value is a valid TypeDefinition
 */
export function isTypeDefinition(test: any): test is TypeDefinition<any> {
    if (typeof test !== "object" || test === null) {
        return false;
    }
    if (test.isTypeDefinition === TypeDefinitionSymbol) {
        return true;
    }
    return false;
}

/** Represents either a static value or a getter function */
export type ValueOrGetter<T> = T | (() => T);

/**
 * Reads typed data from DataView
 * @param view - Source DataView
 * @param type - Type definition
 * @param offset - Read offset in bytes
 * @param littleEndian - Byte order (default: big-endian)
 * @returns Decoded value
 * @example 
 * const num = get(view, INT, 0x10, true);
 */
export function get<T>(view: DataView, type: TypeDefinition<T>, offset: number, littleEndian?: boolean): T {
    return type.getter({
        view,
        offset,
        littleEndian
    });
}

/**
 * Writes typed data to DataView
 * @param view - Target DataView
 * @param type - Type definition
 * @param offset - Write offset in bytes
 * @param value - Value to encode
 * @param littleEndian - Byte order (default: big-endian)
 * @example 
 * set(view, FLOAT, 0x08, 3.14159);
 */
export function set<T>(view: DataView, type: TypeDefinition<T>, offset: number, value: T, littleEndian?: boolean): void {
    return type.setter({
        view,
        offset,
        littleEndian
    }, value);
}

/**
 * Converts DataView region to reactive object
 * @param view - Source DataView
 * @param type - Type definition
 * @param offset - Byte offset or offset getter
 * @param littleEndian - Byte order (default: big-endian)
 * @returns Reactive proxy object
 * @remarks Property accesses trigger automatic get/set operations
 * @example 
 * const player = reactive(view, PlayerStruct, 0x100);
 * player.health = 80; // Automatically writes to DataView
 */
export function reactive<T>(view: DataView, type: TypeDefinition<T>, offset: ValueOrGetter<number>, littleEndian?: boolean): T {
    const baseOffset = typeof offset === "function" ? offset : () => offset;
    return type.reactive({
        view,
        littleEndian,
        localOffset: 0,
        baseOffset,
        cacheGetter: () => void 0
    });
}

/** Reference wrapper for reactive value types */
export interface Ref<T> {
    value: T;
}

/**
 * Creates reactive reference for value types
 * @param view - Source DataView
 * @param type - Type definition
 * @param offset - Byte offset or offset getter
 * @param littleEndian - Byte order (default: big-endian)
 * @returns Reactive reference object
 * @remarks Optimized for primitive/value type access
 * @example 
 * const hp = ref(view, UINT, 0x104);
 * console.log(hp.value); // Reads from DataView
 * hp.value = 100;       // Writes to DataView
 */
export function ref<T>(view: DataView, type: TypeDefinition<T>, offset: ValueOrGetter<number>, littleEndian?: boolean): Ref<T> {
    const baseOffset = typeof offset === "function" ? offset : () => offset;
    let cachedGetter: (() => any) | undefined;
    return {
        [OperationRawSymbol]() {
            return {
                value: type.getter({
                    view,
                    offset: baseOffset(),
                    littleEndian
                })
            };
        },
        get value() {
            if (cachedGetter) {
                return cachedGetter();
            }
            return type.reactive({
                view,
                littleEndian,
                localOffset: 0,
                baseOffset,
                cacheGetter: (getter) => cachedGetter = getter
            });
        },
        set value(value) {
            type.setter({
                view,
                offset: baseOffset(),
                littleEndian
            }, value);
        }
    } as Ref<T>;
}

/**
 * Symbol for retrieving raw values from reactive objects
 * @remarks Reactive objects must implement this symbol
 */
export const OperationRawSymbol = Symbol("TYPE_DEFINITION_RAW");

/**
 * Extracts raw value from reactive objects
 * @param value - Reactive proxy or raw value
 * @returns Underlying non-reactive value
 * @example 
 * const raw = toRaw(reactiveObj);
 */
export function toRaw<T>(value: T): T {
    const target: any = value;
    if (typeof target === "object" && target !== null) {
        const getter = target[OperationRawSymbol];
        if (getter) {
            return getter();
        }
    }
    return target;
}

/**
 * Creates reference for nested reactive property
 * @param target - Reactive source object
 * @param key - Property key to reference
 * @returns Reactive reference to specified property
 * @example 
 * const hpRef = toRef(player, 'health');
 */
export function toRef<T, K extends keyof T>(target: T, key: K): Ref<T[K]> {
    return {
        [OperationRawSymbol]() {
            return {
                value: target[key]
            };
        },
        get value() {
            return target[key];
        },
        set value(value) {
            target[key] = value;
        }
    } as Ref<T[K]>;
}
