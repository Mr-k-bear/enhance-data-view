import { TypeDefinitionSymbol } from "./core";
import type { OperationGetter, OperationSetter, OperationReactive } from "./core";
import type { TypeDefinition } from "./core";

/** Defines encoding/decoding operations for string data */
export interface StringCoder {
    /** Converts string to byte array */
    encode: (string: string) => Uint8Array;
    /** Converts byte array to string */
    decode: (buffer: Uint8Array) => string;
}

/** Default UTF-8 encoder/decoder implementation */
export const DefaultStringCoder = ((): StringCoder => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8");
    return {
        encode(string) {
            return encoder.encode(string);
        },
        decode(buffer) {
            return decoder.decode(buffer);
        }
    }
})();

/**
 * Immutable string type definition (frozen state)
 */
export interface StringDefinitionFreezed extends TypeDefinition<string> {
    /** Padding byte value (if defined) */
    filler: number | undefined;
    /** Encoding/decoding implementation */
    coder: StringCoder;
    /**
     * Creates a mutable clone
     * @param name - Optional new name for cloned definition
     * @returns Mutable string definition
     */
    clone(name?: string): StringDefinition;
}

/**
 * Configurable string type definition
 * @remarks 
 * - Supports custom encodings and padding behavior
 * - Fixed-length representation in binary data
 */
export interface StringDefinition extends StringDefinitionFreezed {
    /**
     * Sets type name
     * @param name - New name for the type
     * @returns Current instance for chaining
     */
    setName(name?: string): StringDefinition;
    /**
     * Sets fixed byte size
     * @param size - Byte length of string field
     * @returns Current instance for chaining
     * @remarks Determines maximum encoded length
     */
    setSize(size?: number): StringDefinition;
    /**
     * Sets memory alignment requirement
     * @param align - Alignment requirement
     * @returns Current instance for chaining
     * @defaultValue 1 (byte-aligned)
     */
    setAlign(align?: number): StringDefinition;
    /**
     * Sets padding behavior
     * @param filler - Byte value (0-255) for padding:
     * - When writing: Fills remaining space after encoding
     * - When reading: Stops decoding at first occurrence
     * @returns Current instance for chaining
     * @remarks 
     * - Set to `undefined` to disable padding behavior
     * - Default: `undefined` (no padding)
     * @example 
     * .setFiller(0) // Null-terminated string behavior
     */
    setFiller(filler?: number): StringDefinition;
    /**
     * Sets custom encoding implementation
     * @param coder - Encoding/decoding implementation
     * @returns Current instance for chaining
     * @defaultValue UTF-8 encoder
     */
    setCoder(coder?: StringCoder): StringDefinition;
    /**
     * Freezes the type definition to prevent modification
     * @returns Immutable version of the type definition
     * @remarks 
     * - Improves performance by preventing runtime changes
     * - Should be called after final configuration
     * @example 
     * const finalType = mutableType.freeze();
     */
    freeze(): StringDefinitionFreezed;
}

/**
 * Creates configurable string type definition
 * @overload
 * @param name - Type name
 * @returns Empty string definition (size=0, no filler)
 */
export function defineString(name?: string): StringDefinition;
/**
 * Creates configurable string type definition
 * @overload
 * @param size - Fixed byte size
 * @param filler - Padding byte value (0-255)
 * @param name - Optional type name
 * @returns Preconfigured string definition
 * @example 
 * // Null-terminated 32-byte string
 * const NTString = defineString(32, 0, 'NullTerminated');
 */
export function defineString(size: number, filler?: number, name?: string): StringDefinition;
/**
 * String definition implementation
 * @param param0 - Size or name
 * @param filler - Padding byte value
 * @param name - Type name
 * @returns String definition instance
 */
export function defineString(param0?: number | string, filler?: number, name?: string): StringDefinition {
    let _name: string | undefined;
    let _size: number = 0;
    let _align: number | undefined;
    let _filler: number | undefined;
    let _coder: StringCoder = DefaultStringCoder;
    let _bytes = new Uint8Array(_size);
    const setName: StringDefinition["setName"] = (name) => {
        _name = name;
        return typeDefinition;
    };
    const setSize: StringDefinition["setSize"] = (size) => {
        _size = size ?? 0;
        _bytes = new Uint8Array(_size);
        return typeDefinition;
    };
    const setAlign: StringDefinition["setAlign"] = (align) => {
        _align = align;
        return typeDefinition;
    };
    const setFiller: StringDefinition["setFiller"] = (filler) => {
        _filler = filler;
        return typeDefinition;
    };
    const setCoder: StringDefinition["setCoder"] = (coder) => {
        _coder = coder ?? DefaultStringCoder;
        return typeDefinition;
    };
    const freeze: StringDefinition["freeze"] = () => {
        const newDefinition = clone();
        return Object.freeze({
            isTypeDefinition: TypeDefinitionSymbol,
            name: newDefinition.name,
            size: newDefinition.size,
            align: newDefinition.align,
            filler: newDefinition.filler,
            coder: newDefinition.coder,
            getter: newDefinition.getter,
            setter: newDefinition.setter,
            reactive: newDefinition.reactive,
            clone: newDefinition.clone
        });
    };
    const clone: StringDefinition["clone"] = (name) => defineString(_size, _filler, name ?? _name)
        .setAlign(_align)
        .setCoder(_coder);
    const getter: OperationGetter<string> = ({ view, offset }) => {
        let actualLength = _size;
        for (let index = 0; index < _size; index++) {
            const byte = view.getUint8(offset + index);
            _bytes[index] = byte;
            if (typeof _filler === "number" && byte === _filler) {
                actualLength = index;
                break;
            }
        }
        const actualBytes = _bytes.subarray(0, actualLength);
        return _coder.decode(actualBytes);
    };
    const setter: OperationSetter<string> = ({ view, offset }, value) => {
        const bytes = _coder.encode(value);
        const writeLength = Math.min(bytes.length, _size);
        for (let index = 0; index < writeLength; index++) {
            view.setUint8(offset + index, bytes[index]);
        }
        if (typeof _filler === "number" && writeLength < _size) {
            for (let index = writeLength; index < _size; index++) {
                view.setUint8(offset + index, _filler);
            }
        }
    };
    const reactive: OperationReactive<string> = ({ view, localOffset, baseOffset, cacheGetter }) => {
        const getter = () => {
            const offset = localOffset + baseOffset();
            let actualLength = _size;
            for (let index = 0; index < _size; index++) {
                const byte = view.getUint8(offset + index);
                _bytes[index] = byte;
                if (typeof _filler === "number" && byte === _filler) {
                    actualLength = index;
                    break;
                }
            }
            const actualBytes = _bytes.subarray(0, actualLength);
            return _coder.decode(actualBytes);
        };
        cacheGetter(getter);
        return getter()
    };
    const typeDefinition: StringDefinition = {
        isTypeDefinition: TypeDefinitionSymbol,
        get name() {
            return _name ?? `string(${_size})`;
        },
        get size() {
            return Math.max(_size, 0);
        },
        get align() {
            return Math.max(_align ?? 1, 1);
        },
        get filler() {
            return _filler;
        },
        get coder() {
            return _coder;
        },
        getter,
        setter,
        reactive,
        setName,
        setSize,
        setAlign,
        setFiller,
        setCoder,
        freeze,
        clone
    };
    if (typeof param0 === "number") {
        setSize(param0);
        setFiller(filler);
        setName(name);
    }
    else {
        setName(param0);
    }
    return typeDefinition;
}
