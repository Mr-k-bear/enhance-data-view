import { TypeDefinitionSymbol } from "./core";
import type { TypeDefinition, OperationGetter, OperationSetter, OperationReactive } from "./core";

/**
 * Immutable primitive type definition (frozen state)
 * @template T - JavaScript type represented by this primitive
 */
export interface PrimitiveDefinitionFreezed<T> extends TypeDefinition<T> {
    /**
     * Creates a mutable clone of the type definition
     * @param name - Optional new name for the cloned definition
     * @returns New mutable primitive type definition
     * @example 
     * const cloned = frozenType.clone('MyRenamedType');
     */
    clone(name?: string): PrimitiveDefinition<T>;
}

/**
 * Mutable primitive type definition with chainable configuration
 * @template T - JavaScript type represented by this primitive
 * @remarks Use chainable methods to configure properties before freezing
 */
export interface PrimitiveDefinition<T> extends PrimitiveDefinitionFreezed<T> {
    /**
     * Sets the type name (for debugging/identification)
     * @param name - New name for the type
     * @returns Current instance for chaining
     * @example 
     * .setName('ColorRGBA')
     */
    setName(name?: string): PrimitiveDefinition<T>;
    /**
     * Sets the byte size of the type
     * @param size - Size in bytes (default: 0)
     * @returns Current instance for chaining
     * @example 
     * .setSize(4)
     */
    setSize(size?: number): PrimitiveDefinition<T>;
    /**
     * Sets the memory alignment requirement
     * @param align - Alignment value (default: 1)
     * @returns Current instance for chaining
     * @example 
     * .setAlign(4) // DWORD alignment
     */
    setAlign(align?: number): PrimitiveDefinition<T>;
    /**
     * Sets the read operation implementation
     * @param getter - Read function (default: throws error)
     * @returns Current instance for chaining
     * @example 
     * .setGetter(ctx => ctx.view.getUint32(ctx.offset))
     */
    setGetter(getter?: OperationGetter<T>): PrimitiveDefinition<T>;
    /**
     * Sets the write operation implementation
     * @param setter - Write function (default: throws error)
     * @returns Current instance for chaining
     * @example 
     * .setSetter((ctx, value) => ctx.view.setUint32(ctx.offset, value))
     */
    setSetter(setter?: OperationSetter<T>): PrimitiveDefinition<T>;
    /**
     * Sets the reactive conversion implementation
     * @param reactive - Reactive converter (default: basic getter-based)
     * @returns Current instance for chaining
     * @example 
     * .setReactive(ctx => createReactiveProxy(...))
     */
    setReactive(reactive?: OperationReactive<T>): PrimitiveDefinition<T>;
    /**
     * Freezes the type definition to prevent modification
     * @returns Immutable version of the type definition
     * @remarks 
     * - Improves performance by preventing runtime changes
     * - Should be called after final configuration
     * @example 
     * const finalType = mutableType.freeze();
     */
    freeze(): PrimitiveDefinitionFreezed<T>;
}

/**
 * Creates a configurable primitive type definition
 * @param name - Initial type name (optional)
 * @returns Mutable primitive type definition
 * @remarks 
 * - Start with this to define custom binary types
 * - Chain configuration methods before freezing
 * @example 
 * const Float32 = definePrimitive<number>('float32')
 *   .setSize(4)
 *   .setGetter(ctx => ctx.view.getFloat32(ctx.offset, ctx.littleEndian))
 *   .setSetter((ctx, value) => ctx.view.setFloat32(ctx.offset, value, ctx.littleEndian))
 *   .freeze();
 */
export function definePrimitive<T>(name?: string): PrimitiveDefinition<T> {
    // Configuration state
    let _name: string | undefined = name;
    let _size: number | undefined;
    let _align: number | undefined;
    let _getter: OperationGetter<T> | undefined;
    let _setter: OperationSetter<T> | undefined;
    let _reactive: OperationReactive<T> | undefined;
    const setName: PrimitiveDefinition<T>["setName"] = (name) => {
        _name = name;
        return typeDefinition;
    };
    const setSize: PrimitiveDefinition<T>["setSize"] = (size) => {
        _size = size;
        return typeDefinition;
    };
    const setAlign: PrimitiveDefinition<T>["setAlign"] = (align) => {
        _align = align;
        return typeDefinition;
    };
    const setGetter: PrimitiveDefinition<T>["setGetter"] = (getter) => {
        _getter = getter;
        return typeDefinition;
    };
    const setSetter: PrimitiveDefinition<T>["setSetter"] = (setter) => {
        _setter = setter;
        return typeDefinition;
    };
    const setReactive: PrimitiveDefinition<T>["setReactive"] = (reactive) => {
        _reactive = reactive;
        return typeDefinition;
    };
    const freeze: PrimitiveDefinition<T>["freeze"] = () => {
        const newDefinition = clone();
        return Object.freeze({
            isTypeDefinition: TypeDefinitionSymbol,
            name: newDefinition.name,
            size: newDefinition.size,
            align: newDefinition.align,
            getter: newDefinition.getter,
            setter: newDefinition.setter,
            reactive: newDefinition.reactive,
            clone: newDefinition.clone
        });
    };
    const clone: PrimitiveDefinition<T>["clone"] = (name) => definePrimitive<T>(name ?? _name)
        .setSize(_size)
        .setAlign(_align)
        .setGetter(_getter)
        .setSetter(_setter)
        .setReactive(_reactive);
    // Default operations (throw if not configured)
    const getter: OperationGetter<T> = () => {
        throw new Error(`Getter not implemented for type '${_name || "unknown"}'`);
    };
    const setter: OperationSetter<T> = () => {
        throw new Error(`Setter not implemented for type '${_name || "unknown"}'`);
    };
    // Default reactive implementation
    const reactive: OperationReactive<T> = ({ view, littleEndian, localOffset, baseOffset, cacheGetter }) => {
        const getter = () => typeDefinition.getter({
            view,
            offset: localOffset + baseOffset(),
            littleEndian,
        });
        cacheGetter(getter);
        return getter()
    };
    // Main definition object with getters
    const typeDefinition: PrimitiveDefinition<T> = {
        isTypeDefinition: TypeDefinitionSymbol,
        get name() {
            return _name ?? "unknown";
        },
        get size() {
            return Math.max(_size ?? 0, 0);
        },
        get align() {
            return Math.max(_align ?? _size ?? 1, 1);
        },
        get getter() {
            return _getter ?? getter;
        },
        get setter() {
            return _setter ?? setter;
        },
        get reactive() {
            return _reactive ?? reactive;
        },
        setName,
        setSize,
        setAlign,
        setGetter,
        setSetter,
        setReactive,
        freeze,
        clone
    };
    return typeDefinition;
}
