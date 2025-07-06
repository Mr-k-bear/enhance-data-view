// Copyright (c) 2024 - 2025 MrKBear

export interface TypeOperationErrorOptions extends ErrorOptions {
    /** Type descriptor involved in the operation */
    type?: TypeDefined<any>;
    /** Data view being accessed during the operation */
    view?: DataView;
    /** Buffer offset where the operation occurred */
    offset?: number;
    /** Endianness used during the operation */
    littleEndian?: boolean;
    /** Indicates if the operation was a read attempt */
    read?: boolean;
    /** Indicates if the operation was a write attempt */
    write?: boolean;
    /** Write value */
    writeValue?: any;
    /** The error occurred during the definition period */
    defined?: boolean;
}

/**
 * Error thrown during type descriptor operations
 * 
 * @remarks
 * Represents failures that occur during binary data read/write operations
 * using type descriptors. Contains contextual information about the failed operation.
 */
export class TypeOperationError extends Error {
    /** Type descriptor involved in the failed operation */
    type?: TypeDefined<any>;
    /** Data view being accessed during the failure */
    view?: DataView;
    /** Buffer offset at failure point */
    offset?: number;
    /** Endianness used during the operation */
    littleEndian?: boolean;
    /** Whether the failed operation was a read attempt */
    read?: boolean;
    /** Whether the failed operation was a write attempt */
    write?: boolean;
    /** Write value */
    writeValue?: any;
    /** The error occurred during the definition period */
    defined?: boolean;

    /**
     * Creates a TypeOperationError instance
     * 
     * @param message - Human-readable error description
     * @param options - Contextual information about the failed operation
     */
    public constructor(message?: string, options?: TypeOperationErrorOptions) {
        super(message, options);
        this.type = options?.type;
        this.view = options?.view;
        this.offset = options?.offset;
        this.littleEndian = options?.littleEndian;
        this.read = options?.read;
        this.write = options?.write;
        this.writeValue = options?.writeValue;
        this.defined = options?.defined
    }
}

/**
 * Value reader function within type descriptor objects.
 * 
 * @typeParam T - The type described by this descriptor
 * @param view - The data view being operated on
 * @param offset - Read offset position
 * @param littleEndian - Whether to use little-endian byte order
 * @param size - Callback to write actual data size to output. Only required for dynamic-sized types
 * @returns Result value
 */
export type TypeDefinedGetter<T> = (view: DataView, offset: number, littleEndian: boolean | undefined, size: (size: number) => void) => T;

/**
 * Value writer function within type descriptor objects.
 * 
 * @typeParam T - The type described by this descriptor
 * @param view - The data view being operated on
 * @param offset - Write offset position
 * @param littleEndian - Whether to use little-endian byte order
 * @param value - The value to write
 * @returns Actual number of bytes written. Only required for dynamic-sized types.
 */
export type TypeDefinedSetter<T> = (view: DataView, offset: number, littleEndian: boolean | undefined, value: T) => number | undefined | null | void;

/**
 * Type descriptor object.
 * 
 * @typeParam T - The type described by this descriptor
 */
export interface TypeDefined<T> extends Object {
    /**
     * Type name (used for diagnostic output).
     */
    name: string;
    /**
     * Type size in bytes (default: undefined).
     * 
     * - A positive number indicates the fixed byte size in buffers
     * - For types with runtime-determined sizes (e.g. C-style strings),
     *   use `null` or `undefined` to indicate dynamic sizing
     */
    size?: number | null | undefined;
    /**
     * Memory alignment requirement when used as a struct field
     * 
     * @remarks
     * - When unset (`undefined` or `null`):
     *   - For fixed-size types: Uses the type's `size` as alignment value
     *   - For dynamic-size types: Defaults to 1 (no alignment)
     * - When set: Overrides both default behaviors
     * 
     * @note Alignment values should be powers of 2 (1, 2, 4, 8...).
     * Non-power-of-2 values may cause undefined behavior.
     */
    align?: number | null | undefined;
    /**
     * Forces little-endian byte order for this type's operations.
     * 
     * - When `true`: Always uses little-endian
     * - When `false`: Always uses big-endian
     * - When `null` or `undefined`: Inherits endianness from the current operation context
     */
    littleEndian?: boolean | null | undefined;
    /**
     * Value reader function
     */
    getter: TypeDefinedGetter<T>;
    /**
     * Value writer function
     */
    setter: TypeDefinedSetter<T>;
}

/**
 * Extracts the described type from a type descriptor.
 * 
 * @typeParam T - Type of descriptor
 */
export type TypeDefinedInfer<T extends TypeDefined<any>> = T extends TypeDefined<infer W> ? W : unknown;

/**
 * Type descriptor context (builder interface).
 */
export interface TypeDefinedContext<T> extends TypeDefined<T> {
    /**
     * Sets the type name.
     * 
     * @param name - New diagnostic name for the type
     * @returns This context
     */
    setName(name: string): TypeDefinedContext<T>;
    /** Alias for {@link setName} */
    n: TypeDefinedContext<T>["setName"];
    /**
     * Sets the type size.
     * 
     * @param size - Fixed byte size or dynamic for runtime-determined sizes
     * @returns This context
     */
    setSize(size?: number | null | undefined): TypeDefinedContext<T>;
    /** Alias for {@link setSize} */
    s: TypeDefinedContext<T>["setSize"];
    /**
     * Sets the default byte alignment for struct fields.
     * {@link TypeDefined.align}
     * 
     * @param align - Alignment value (must be power of 2)
     * @returns This context
     */
    setAlign(align?: number | null | undefined): TypeDefinedContext<T>;
    /** Alias for {@link setAlign} */
    a: TypeDefinedContext<T>["setAlign"];
    /**
     * Sets little-endian byte order.
     * 
     * @param littleEndian - {@link TypeDefined.littleEndian}
     * @returns This context
     */
    setLittleEndian(littleEndian?: boolean | null | undefined): TypeDefinedContext<T>;
    /** Alias for {@link setLittleEndian} */
    l: TypeDefinedContext<T>["setLittleEndian"];
    /**
     * Sets the value reader function.
     * 
     * @param getter - Function to read values of this type
     * @returns This context
     */
    setGetter(getter: TypeDefinedGetter<T>): TypeDefinedContext<T>;
    /** Alias for {@link setGetter} */
    g: TypeDefinedContext<T>["setGetter"];
    /**
     * Sets the value writer function.
     * 
     * @param setter - Function to write values of this type
     * @returns This context
     */
    setSetter(setter: TypeDefinedSetter<T>): TypeDefinedContext<T>;
    /** Alias for {@link setSetter} */
    w: TypeDefinedContext<T>["setSetter"];
    /**
     * Clones this descriptor, returning a new instance.
     * 
     * @param name - New diagnostic name for the cloned type
     * @returns New context instance
     */
    clone(name?: string): TypeDefinedContext<T>;
    /** Alias for {@link clone} */
    c: TypeDefinedContext<T>["clone"];
}

/**
 * Creates a new type descriptor builder context.
 * 
 * @param name - Diagnostic name for the type (used in error messages)
 * @typeParam T - Type of values this descriptor will handle
 * @returns Builder context for configuring the type descriptor
 * 
 * @example
 * ```typescript
 * // Define a 32-bit integer type
 * const int_32 = definedType<number>("int_32")
 *   .setSize(4)
 *   .setGetter((view, offset, le) => view.getInt32(offset, le))
 *   .setSetter((view, offset, le, value) => view.setInt32(offset, value, le));
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Define a dynamic string type (C-style)
 * const c_string = definedType<string>("c_string")
 *   .setGetter((view, offset, le, setSize) => {
 *     let length = 0;
 *     while (view.getUint8(offset + length) !== 0) length ++;
 *     setSize(length + 1);  // Include null terminator
 *     return Buffer.from(new Uint8Array(view.buffer, offset, length)).toString("utf-8")
 *   });
 * ```
 * 
 * @example
 * ```typescript
 * // Using method aliases for concise configuration
 * const float_64 = definedType<number>("float_64")
 *   .s(8)  // setSize alias
 *   .g((v, o, le) => v.getFloat64(o, le))  // setGetter alias
 *   .w((v, o, le, val) => v.setFloat64(o, val, le))  // setSetter alias
 * ```
 */
export function definedType<T = unknown>(name?: string): TypeDefinedContext<T> {
    const getter: TypeDefinedGetter<T> = (view, offset, littleEndian) => {
        throw new TypeOperationError(`[${context}]: Reader function is unset.`, {
            type: context,
            view,
            offset,
            littleEndian,
            read: true
        });
    };
    const setter: TypeDefinedSetter<T> = (view, offset, littleEndian, value) => {
        throw new TypeOperationError(`[${context}]: Writer function is unset.`, {
            type: context,
            view,
            offset,
            littleEndian,
            write: true,
            writeValue: value
        });
    };
    const setName: TypeDefinedContext<T>["setName"] = (name) => {
        context.name = name || context.name;
        return context;
    };
    const setSize: TypeDefinedContext<T>["setSize"] = (size) => {
        context.size = size;
        return context;
    };
    const setAlign: TypeDefinedContext<T>["setAlign"] = (align) => {
        context.align = align;
        return context;
    };
    const setLittleEndian: TypeDefinedContext<T>["setLittleEndian"] = (littleEndian) => {
        context.littleEndian = littleEndian;
        return context;
    };
    const setGetter: TypeDefinedContext<T>["setGetter"] = (getter) => {
        context.getter = getter;
        return context;
    };
    const setSetter: TypeDefinedContext<T>["setSetter"] = (setter) => {
        context.setter = setter;
        return context;
    };
    const clone: TypeDefinedContext<T>["clone"] = (name) => {
        const newInstance = definedType<T>(name ?? context.name);
        newInstance.size = context.size;
        newInstance.littleEndian = context.littleEndian;
        newInstance.getter = context.getter;
        newInstance.setter = context.setter;
        return newInstance;
    };
    const toString: TypeDefinedContext<T>["toString"] = () => {
        return `type:${context.name}`;
    };
    const context: TypeDefinedContext<T> = {
        name: name ?? "unknown",
        getter,
        setter,
        setName,
        n: setName,
        setSize,
        s: setSize,
        setAlign,
        a: setAlign,
        setLittleEndian,
        l: setLittleEndian,
        setGetter,
        g: setGetter,
        setSetter,
        w: setSetter,
        clone,
        c: clone,
        toString
    };
    return context;
}

/**
 * Type utility to force TypeScript to simplify/compute type representations.
 * 
 * @typeParam T - The type to flatten/simplify
 * 
 * @remarks
 * This is a type-level utility with no runtime behavior. \
 * It triggers TypeScript's type simplification mechanism.
 */
type Flatten<T> = {} & { [K in keyof T]: T[K] };

/**
 * Valid key types for struct descriptor objects.
 * 
 * @remarks
 * Represents the allowed key types when defining struct field mappings.
 */
export type StructDefinedKey = string | number | symbol;

/**
 * Descriptor for a single property within a struct type
 * 
 * @typeParam T - Type of the property value
 */
export interface StructDefinedProperty<T> {
    /**
     * Property key (field name)
     */
    key: StructDefinedKey;
    /**
     * Type descriptor for this property
     */
    type: TypeDefined<T>;
    /**
     * Memory alignment requirement for this property
     * 
     * @remarks
     * - When unset (`undefined` or `null`), inherits the type's alignment
     * - When set, overrides the type's alignment for this property
     * - Affects offset calculation by aligning the property's starting address
     */
    align?: number | undefined | null;
    /**
     * Absolute byte offset from struct's base address
     * 
     * @remarks
     * - When unset (`undefined` or `null`), offset is automatically calculated
     * - Manual setting bypasses automatic layout computation
     */
    offset?: number | undefined | null;
    /**
     * @internal
     */
    offsetCache?: number | undefined | null;
    /**
     * Marks this property as padding space
     * 
     * @remarks
     * Padding properties:
     * - Are read/written during struct operations
     * - Are excluded from serialization/deserialization results
     * - Typically used for reserved memory regions or alignment gaps
     */
    padding?: boolean | undefined | null;
}

/**
 * Builder context for defining struct type descriptors
 * 
 * @typeParam T - Current shape of the struct as a mapped type
 */
export interface StructDefinedContext<T extends Record<StructDefinedKey, any>> extends TypeDefined<T> {
    /**
     * Maximum alignment requirement among all struct fields
     * 
     * @internal
     * 
     * @remarks
     * - Automatically computed from all fields' effective alignments
     * - For empty structs, defaults to 1 (no alignment)
     * - Updated automatically when fields are added, modified or removed
     * 
     * @note This value determines:
     * 1. The struct's overall alignment when used in other structs
     * 2. The padding needed after the last field
     * 3. The struct's size when used in arrays
     */
    maxAlign: number;
    /**
     * Ordered list of struct field descriptors
     * 
     * @remarks
     * The order determines the memory layout of the struct.
     * Contains both regular fields and padding fields.
     */
    properties: StructDefinedProperty<any>[];
    /**
     * Sets the struct's diagnostic name
     * 
     * @param name - Name used in error messages and debugging
     * @returns This context
     */
    setName(name: string): StructDefinedContext<T>;
    /** Alias for {@link setName} */
    n: StructDefinedContext<T>["setName"];
    /**
     * Sets the default byte alignment for struct fields.
     * {@link TypeDefined.align}
     * 
     * @param align - Alignment value (must be power of 2)
     * @returns This context
     */
    setAlign(align?: number | null | undefined): StructDefinedContext<T>;
    /** Alias for {@link setAlign} */
    a: StructDefinedContext<T>["setAlign"];
    /**
     * Sets little-endian byte order.
     * 
     * @param littleEndian - {@link TypeDefined.littleEndian}
     * @returns This context
     */
    setLittleEndian(littleEndian?: boolean | undefined | null): StructDefinedContext<T>;
    /** Alias for {@link setLittleEndian} */
    l: StructDefinedContext<T>["setLittleEndian"];
    /**
     * Adds a new field to the struct
     * 
     * @typeParam K - Field key type
     * @typeParam V - Field value type
     * @param key - Field name or symbol
     * @param type - Type descriptor for the field
     * @param offset - Optional new offset position (overrides auto-calculation)
     * @param align - Optional new alignment requirement
     * @returns This context
     * 
     * @example
     * ```typescript
     * // Add a 32-bit integer field named 'id'
     * structContext.addProperty("id", int_32);
     * ```
     * 
     * @example
     * ```typescript
     * // Add field with custom alignment, offset
     * structContext.addProperty("foo", some_type, 0xFF);
     * structContext.addProperty("bar", some_type, void 0, 8);
     * ```
     */
    addProperty<K extends StructDefinedKey, V>(key: K extends keyof T ? never : K, type: TypeDefined<V>, offset?: number, align?: number): StructDefinedContext<Flatten<T & { [X in K]: V }>>;
    /** Alias for {@link addProperty} */
    p: StructDefinedContext<T>["addProperty"];
    /**
     * Adds padding space to the struct layout
     * 
     * @param type - Type descriptor determining padding size
     * @param offset - Optional new offset position (overrides auto-calculation)
     * @param align - Optional new alignment requirement
     * @returns This context
     */
    addPadding(type: TypeDefined<void> | TypeDefined<undefined>, offset?: number, align?: number): StructDefinedContext<T>;
    /** Alias for {@link addPadding} */
    o: StructDefinedContext<T>["addPadding"];
    /**
     * Updates an existing struct field's definition
     * 
     * @typeParam K - Key of the field to update
     * @typeParam V - New value type for the field
     * @param key - Name of the field to modify
     * @param type - New type descriptor for the field
     * @param offset - Optional new offset position (overrides auto-calculation)
     * @param align - Optional new alignment requirement
     * @returns This context
     * 
     * @remarks
     * This method:
     * 1. Replaces the field's type descriptor while maintaining its position
     * 2. After the update, the structure layout will be recalculated
     */
    updateProperty<K extends keyof T, V>(key: K, type: TypeDefined<V>, offset?: number, align?: number): StructDefinedContext<Flatten<Omit<T, K> & { [P in K]: V }>>;
    /** Alias for {@link updateProperty} */
    u: StructDefinedContext<T>["updateProperty"];
    /**
     * Removes a field from the struct definition
     * 
     * @typeParam K - Key of the field to remove
     * @param key - Name of the field to remove
     * @returns This context
     * 
     * @remarks
     * This method:
     * 1. Removes the field from the struct layout
     * 2. After the remove, the structure layout will be recalculated
     */
    removeProperty<K extends keyof T>(key: K): StructDefinedContext<Flatten<Omit<T, K>>>;
    /** Alias for {@link removeProperty} */
    r: StructDefinedContext<T>["removeProperty"];
    /**
     * Clones this descriptor, returning a new instance.
     * 
     * @param name - New diagnostic name for the cloned type
     * @returns New context instance
     */
    clone(name?: string): StructDefinedContext<T>;
    /** Alias for {@link clone} */
    c: StructDefinedContext<T>["clone"];
}

/**
 * Creates a builder context for defining struct types
 * 
 * @param name - Optional diagnostic name for the struct (used in error messages)
 * @typeParam T - Initial struct shape (defaults to empty object `{}`)
 * @returns Builder context for configuring the struct descriptor
 * 
 * @remarks
 * This function initiates a fluent API for:
 * - Defining field layouts with memory alignment
 * - Adding padding regions
 * - Configuring endianness
 * - Building complex binary structures
 * 
 * @example
 * ```typescript
 * // Define an empty struct with diagnostic name
 * const empty_struct = definedStruct("my_struct");
 * ```
 * 
 * @example
 * ```typescript
 * // Define a person struct with multiple fields
 * const person = definedStruct("person")
 *   .addProperty("id", int_32)
 *   .addProperty("name", c_string)
 *   .setAlign(4); // 4-byte alignment
 * ```
 */
export function definedStruct<T extends Record<StructDefinedKey, any> = {}>(name?: string): StructDefinedContext<T> {
    const calculateOffset = (property: StructDefinedProperty<any>, offset: number, cached: boolean): number => {
        // Absolute offset
        if (typeof property.offset === "number") {
            return property.offset;
        }
        // Cached offset
        if (typeof property.offsetCache === "number") {
            return property.offsetCache;
        }
        // Padding calculation
        const align = Math.max(property.align ?? property.type.align ?? property.type.size ?? 1, 1);
        const padding = (align - (offset % align)) % align;
        const alignedOffset = offset + padding;
        // Cached
        if (cached) {
            property.offsetCache = alignedOffset;
        }
        return alignedOffset;
    };
    const getter: TypeDefinedGetter<T> = (view, offset, littleEndian, size) => {
        const structure: Record<StructDefinedKey, any> = {};
        let staticSize = true;
        let currentOffset = 0;
        let currentSize: number | undefined;
        const sizeCallback = (size: number) => {
            currentSize = size;
        }
        for (const property of context.properties) {
            currentSize = void 0;
            currentOffset = calculateOffset(property, currentOffset, staticSize);
            const of = offset + currentOffset;
            const le = littleEndian ?? (typeof property.type.littleEndian === "boolean" ? property.type.littleEndian : void 0);
            const value = property.type.getter(view, of, le, sizeCallback);
            // Padding
            if (!property.padding) {
                structure[property.key] = value;
            }
            // Static size
            if (typeof property.type.size === "number") {
                currentOffset += property.type.size;
                continue;
            }
            // Dynamic size
            staticSize = false;
            if (typeof currentSize === "number") {
                currentOffset += currentSize;
                continue;
            }
            const keyString = typeof property.key === "symbol" ? `Symbol(${property.key.description || ""})` : property.key;
            throw new TypeOperationError(`[${context} => ${keyString}]: The dynamic-sized types must return its actual size.`, {
                type: context,
                view,
                offset: of,
                littleEndian: le,
                read: true
            });
        }
        // Output
        size(currentOffset);
        return structure;
    };
    const setter: TypeDefinedSetter<T> = (view, offset, littleEndian, value) => {
        let staticSize = true;
        let currentOffset = 0;
        for (const property of context.properties) {
            currentOffset = calculateOffset(property, currentOffset, staticSize);
            const of = offset + currentOffset;
            const le = littleEndian ?? (typeof property.type.littleEndian === "boolean" ? property.type.littleEndian : void 0);
            // Padding
            let val: any = void 0;
            if (!property.padding) {
                val = value[property.key];
            }
            const currentSize = property.type.setter(view, of, le, val);
            // Static size
            if (typeof property.type.size === "number") {
                currentOffset += property.type.size;
                continue;
            }
            // Dynamic size
            staticSize = false;
            if (typeof currentSize === "number") {
                currentOffset += currentSize;
                continue;
            }
            const keyString = typeof property.key === "symbol" ? `Symbol(${property.key.description || ""})` : property.key;
            throw new TypeOperationError(`[${context} => ${keyString}]: The dynamic-sized types must return its actual size.`, {
                type: property.type,
                view,
                offset: of,
                littleEndian: le,
                write: true,
                writeValue: val
            });
        }
        return currentOffset;
    };
    const calculateLayout = () => {
        let maxAlign: number = 1;
        let currentOffset: number | undefined = 0;
        for (const property of context.properties) {
            // Clear cache
            property.offsetCache = void 0;
            // Update max align
            const align = Math.max(property.align ?? property.type.align ?? property.type.size ?? 1, 1);
            maxAlign = Math.max(maxAlign, align);
            // Cache offset
            if (typeof currentOffset !== "number") {
                continue;
            }
            currentOffset = calculateOffset(property, currentOffset, true);
            // Static size
            if (typeof property.type.size === "number") {
                currentOffset += property.type.size;
            }
            // Dynamic size
            else {
                currentOffset = void 0;
            }
        }
        // End padding
        if (typeof currentOffset === "number") {
            const endPadding = (maxAlign - (currentOffset % maxAlign)) % maxAlign;
            currentOffset += endPadding;
        }
        context.maxAlign = maxAlign;
        context.size = currentOffset;
    };
    const setName: StructDefinedContext<T>["setName"] = (name) => {
        context.name = name || context.name;
        return context;
    };
    const setAlign: StructDefinedContext<T>["setAlign"] = (align) => {
        context.align = align;
        return context;
    };
    const setLittleEndian: StructDefinedContext<T>["setLittleEndian"] = (littleEndian) => {
        context.littleEndian = littleEndian;
        return context;
    };
    const pushProperty = (property: StructDefinedProperty<any>): StructDefinedContext<T> => {
        // Duplicate Check
        for (const prop of context.properties) {
            if (prop.key !== property.key) {
                continue;
            }
            const keyString = typeof prop.key === "symbol" ? `Symbol(${prop.key.description || ""})` : prop.key;
            throw new TypeOperationError(
                `[${context}] Cannot add property "${keyString}" repeatedly. ` +
                `If you want to modify existing property, please use the "updateProperty()" function`,
                {
                    type: context,
                    defined: true
                }
            );
        }
        context.properties.push(property);
        calculateLayout();
        return context;
    };
    const addProperty: StructDefinedContext<T>["addProperty"] = (key, type, offset, align) => pushProperty({
        key: key,
        type: type,
        align: align,
        offset: offset
    });
    const addPadding: StructDefinedContext<T>["addPadding"] = (type, offset, align) => pushProperty({
        key: Symbol("padding"),
        type: type,
        align: align,
        offset: offset,
        padding: true
    });
    const updateProperty: StructDefinedContext<T>["updateProperty"] = (key: StructDefinedKey, type, ...param) => {
        for (const property of context.properties) {
            if (property.key !== key) {
                continue;
            }
            // Update
            property.type = type;
            if (param.length >= 1) {
                property.offset = param[0];
            }
            if (param.length >= 2) {
                property.align = param[1];
            }
            calculateLayout();
            return context as StructDefinedContext<any>;
        }
        const keyString = typeof key === "symbol" ? `Symbol(${key.description || ""})` : key;
        throw new TypeOperationError(
            `[${context}] Cannot update non-existent property "${keyString}". ` +
            `If you want to add a new property, please use the "addProperty()" function`,
            {
                type: context,
                defined: true
            }
        );
    };
    const removeProperty: StructDefinedContext<T>["removeProperty"] = (key: StructDefinedKey) => {
        for (let i = context.properties.length - 1; i >= 0; i--) {
            const property = context.properties[i];
            if (property.key !== key) {
                continue;
            }
            // Delete
            context.properties.splice(i, 1);
            calculateLayout();
            return context as StructDefinedContext<any>;
        }
        const keyString = typeof key === "symbol" ? `Symbol(${key.description || ""})` : key;
        throw new TypeOperationError(
            `[${context}] Cannot remove non-existent property "${keyString}". ` +
            {
                type: context,
                defined: true
            }
        );
    }
    const clone: StructDefinedContext<T>["clone"] = (name) => {
        const newInstance = definedStruct<T>(name ?? context.name);
        newInstance.size = context.size;
        newInstance.align = context.align;
        newInstance.littleEndian = context.littleEndian;
        newInstance.maxAlign = context.maxAlign;
        newInstance.properties = context.properties.map(p => ({
            key: p.key,
            type: p.type,
            align: p.align,
            offset: p.offset,
            offsetCache: p.offsetCache,
            padding: p.padding
        }));
        return newInstance;
    };
    const toString: StructDefinedContext<T>["toString"] = () => {
        return `struct:${context.name}`;
    };
    let align: number | null | undefined;
    const context: StructDefinedContext<T> = {
        name: name ?? "unknown",
        size: 0,
        get align() {
            return align ?? context.maxAlign;
        },
        set align(value) {
            align = value;
        },
        maxAlign: 1,
        properties: [],
        getter,
        setter,
        setName,
        n: setName,
        setLittleEndian,
        l: setLittleEndian,
        setAlign,
        a: setAlign,
        addProperty,
        p: addProperty,
        addPadding,
        o: addPadding,
        updateProperty,
        u: updateProperty,
        removeProperty,
        r: removeProperty,
        clone,
        c: clone,
        toString
    };
    return context;
}