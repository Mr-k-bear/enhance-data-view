
export interface OperationContext {
    view: DataView;
    offset: number;
    littleEndian?: boolean;
}

export interface OperationContextDynamic {
    view: DataView;
    littleEndian?: boolean;
    localOffset: number;
    baseOffset: () => number;
    cacheGetter: (getter: () => any) => void;
}

export type OperationGetter<T> = (this: TypeDefinition<T>, context: OperationContext) => T;

export type OperationSetter<T> = (this: TypeDefinition<T>, context: OperationContext, value: T) => void;

export type OperationReactive<T> = (this: TypeDefinition<T>, context: OperationContextDynamic) => T;

export const TypeDefinitionSymbol = Symbol("TYPE_DEFINITION");

export interface TypeDefinition<T> {
    isTypeDefinition: typeof TypeDefinitionSymbol;
    name: string;
    size: number;
    align: number;
    getter: OperationGetter<T>;
    setter: OperationSetter<T>;
    reactive: OperationReactive<T>;
}

export function isTypeDefinition(test: any): test is TypeDefinition<any> {
    if (typeof test !== "object" || test === null) {
        return false;
    }
    if (test.isTypeDefinition === TypeDefinitionSymbol) {
        return true;
    }
    return false;
}

export type ValueOrGetter<T> = T | (() => T);

export function get<T>(view: DataView, type: TypeDefinition<T>, offset: number, littleEndian?: boolean): T {
    return type.getter({
        view,
        offset,
        littleEndian
    });
}

export function getArray<T>(view: DataView, type: TypeDefinition<T>, offset: number, length: number, littleEndian?: boolean): Array<T> {
    const result = new Array<T>(length);
    const size = type.size;
    for (let i = 0; i < length; i++) {
        result[i] = type.getter({
            view,
            offset: offset + size * i,
            littleEndian
        });
    }
    return result;
}

export function set<T>(view: DataView, type: TypeDefinition<T>, offset: number, value: T, littleEndian?: boolean): void {
    return type.setter({
        view,
        offset,
        littleEndian
    }, value);
}

export function setArray<T>(view: DataView, type: TypeDefinition<T>, offset: number, array: ArrayLike<T>, littleEndian?: boolean): void {
    const length = array.length;
    const size = type.size;
    for (let i = 0; i < length; i++) {
        type.setter({
            view,
            offset: offset + size * i,
            littleEndian
        }, array[i]);
    }
}

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

export interface Ref<T> {
    value: T;
}

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

export const OperationRawSymbol = Symbol("TYPE_DEFINITION_RAW");

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
