import { TypeDefinitionSymbol } from "./core";
import type { TypeDefinition, OperationGetter, OperationSetter, OperationReactive } from "./core";

export interface PrimitiveDefinitionFreezed<T> extends TypeDefinition<T> {
    clone(name?: string): PrimitiveDefinition<T>;
}

export interface PrimitiveDefinition<T> extends PrimitiveDefinitionFreezed<T> {
    setName(name?: string): PrimitiveDefinition<T>;
    setSize(size?: number): PrimitiveDefinition<T>;
    setAlign(align?: number): PrimitiveDefinition<T>;
    setGetter(getter?: OperationGetter<T>): PrimitiveDefinition<T>;
    setSetter(setter?: OperationSetter<T>): PrimitiveDefinition<T>;
    setReactive(reactive?: OperationReactive<T>): PrimitiveDefinition<T>;
    freeze(): PrimitiveDefinitionFreezed<T>;
}

export function definePrimitive<T>(name?: string): PrimitiveDefinition<T> {
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
    const getter: OperationGetter<T> = () => {
        throw new Error();
    };
    const setter: OperationSetter<T> = () => {
        throw new Error();
    };
    const reactive: OperationReactive<T> = ({ view, littleEndian, localOffset, baseOffset, cacheGetter }) => {
        const getter = () => typeDefinition.getter({
            view,
            offset: localOffset + baseOffset(),
            littleEndian,
        });
        cacheGetter(getter);
        return getter()
    };
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
