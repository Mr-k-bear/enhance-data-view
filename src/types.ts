import { defineType } from "./core";

////////// INT //////////

/**
 * Signed 8-bit integer type descriptor
 * 
 * @remarks
 * - Size: 1 byte
 * - Range: -128 to 127
 * - Corresponds to `DataView.getInt8()` and `DataView.setInt8()`
 */
export const INT_8 = defineType<number>("INT_8")
    .setSize(1)
    .setGetter(({ view, offset }) => view.getInt8(offset))
    .setSetter(({ view, offset }, value) => view.setInt8(offset, value));

/**
 * Signed 16-bit integer type descriptor
 * 
 * @remarks
 * - Size: 2 bytes
 * - Range: -32,768 to 32,767
 * - Endian-sensitive: Uses littleEndian parameter
 * - Corresponds to `DataView.getInt16()` and `DataView.setInt16()`
 */
export const INT_16 = defineType<number>("INT_16")
    .setSize(2)
    .setGetter(({ view, offset, littleEndian }) => view.getInt16(offset, littleEndian))
    .setSetter(({ view, offset, littleEndian }, value) => view.setInt16(offset, value, littleEndian));

/** Alias for {@link INT_16} */
export const SHORT = INT_16.clone("SHORT");

/**
 * Signed 32-bit integer type descriptor
 * 
 * @remarks
 * - Size: 4 bytes
 * - Range: -2,147,483,648 to 2,147,483,647
 * - Endian-sensitive: Uses littleEndian parameter
 * - Corresponds to `DataView.getInt32()` and `DataView.setInt32()`
 */
export const INT_32 = defineType<number>("INT_32")
    .setSize(4)
    .setGetter(({ view, offset, littleEndian }) => view.getInt32(offset, littleEndian))
    .setSetter(({ view, offset, littleEndian }, value) => view.setInt32(offset, value, littleEndian));

/** Alias for {@link INT_32} */
export const INT = INT_32.clone("INT");

/**
 * Signed 64-bit integer type descriptor
 * 
 * @remarks
 * - Size: 8 bytes
 * - Range: -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807
 * - Uses JavaScript BigInt type
 * - Endian-sensitive: Uses littleEndian parameter
 * - Corresponds to `DataView.getBigInt64()` and `DataView.setBigInt64()`
 */
export const INT_64 = defineType<bigint>("INT_64")
    .setSize(8)
    .setGetter(({ view, offset, littleEndian }) => view.getBigInt64(offset, littleEndian))
    .setSetter(({ view, offset, littleEndian }, value) => view.setBigInt64(offset, value, littleEndian));

/** Alias for {@link INT_64} */
export const LONG = INT_64.clone("LONG");

////////// UINT //////////

/**
 * Unsigned 8-bit integer type descriptor
 * 
 * @remarks
 * - Size: 1 byte
 * - Range: 0 to 255
 * - Not affected by endianness (single byte)
 * - Corresponds to `DataView.getUint8()` and `DataView.setUint8()`
 */
export const UINT_8 = defineType<number>("UINT_8")
    .setSize(1)
    .setGetter(({ view, offset }) => view.getUint8(offset))
    .setSetter(({ view, offset }, value) => view.setUint8(offset, value));

/** Alias for {@link UINT_8} */
export const BYTE = UINT_8.clone("BYTE");

/**
 * Single-byte character type descriptor (optimized)
 * 
 * @remarks
 * - Size: 1 byte
 * - Reads/writes a single character from/to a byte
 * - Uses first character of input string only
 * - No input validation!!!
 */
export const CHAR = defineType<string>("CHAR")
    .setSize(1)
    .setGetter(({ view, offset }) => String.fromCharCode(view.getUint8(offset)))
    .setSetter(({ view, offset }, value) => view.setUint8(offset, value.charCodeAt(0)));

/**
 * Unsigned 16-bit integer type descriptor
 * 
 * @remarks
 * - Size: 2 bytes
 * - Range: 0 to 65,535
 * - Endian-sensitive: Uses littleEndian parameter
 * - Corresponds to `DataView.getUint16()` and `DataView.setUint16()`
 */
export const UINT_16 = defineType<number>("UINT_16")
    .setSize(2)
    .setGetter(({ view, offset, littleEndian }) => view.getUint16(offset, littleEndian))
    .setSetter(({ view, offset, littleEndian }, value) => view.setUint16(offset, value, littleEndian));

/** Alias for {@link UINT_16} */
export const USHORT = UINT_16.clone("USHORT");

/** Alias for {@link UINT_16} */
export const WORD = UINT_16.clone("WORD");

/**
 * Unsigned 32-bit integer type descriptor
 * 
 * @remarks
 * - Size: 4 bytes
 * - Range: 0 to 4,294,967,295
 * - Endian-sensitive: Uses littleEndian parameter
 * - Corresponds to `DataView.getUint32()` and `DataView.setUint32()`
 */
export const UINT_32 = defineType<number>("UINT_32")
    .setSize(4)
    .setGetter(({ view, offset, littleEndian }) => view.getUint32(offset, littleEndian))
    .setSetter(({ view, offset, littleEndian }, value) => view.setUint32(offset, value, littleEndian));

/** Alias for {@link UINT_32} */
export const UINT = UINT_32.clone("UINT");

/** Alias for {@link UINT_32} */
export const DWORD = UINT_32.clone("DWORD");

/**
 * Unsigned 64-bit integer type descriptor
 * 
 * @remarks
 * - Size: 8 bytes
 * - Range: 0 to 18,446,744,073,709,551,615
 * - Uses JavaScript BigInt type
 * - Endian-sensitive: Uses littleEndian parameter
 * - Corresponds to `DataView.getBigUint64()` and `DataView.setBigUint64()`
 */
export const UINT_64 = defineType<bigint>("UINT_64")
    .setSize(8)
    .setGetter(({ view, offset, littleEndian }) => view.getBigUint64(offset, littleEndian))
    .setSetter(({ view, offset, littleEndian }, value) => view.setBigUint64(offset, value, littleEndian));

/** Alias for {@link UINT_64} */
export const ULONG = UINT_64.clone("ULONG");

////////// FLOAT //////////

/**
 * Half-precision (16-bit) floating-point type descriptor
 * 
 * @remarks
 * - Size: 2 bytes
 * - Range: ±65504
 * - Precision: ~3-4 decimal digits
 * - Endian-sensitive: Uses littleEndian parameter
 * - Corresponds to `DataView.getFloat16()` and `DataView.setFloat16()`
 */
export const FLOAT_16 = defineType<number>("FLOAT_16")
    .setSize(2)
    .setGetter(({ view, offset, littleEndian }) => view.getFloat16(offset, littleEndian))
    .setSetter(({ view, offset, littleEndian }, value) => view.setFloat16(offset, value, littleEndian));

/**
 * Single-precision (32-bit) floating-point type descriptor
 * 
 * @remarks
 * - Size: 4 bytes
 * - Range: ±3.4e38
 * - Precision: ~7 decimal digits
 * - Endian-sensitive: Uses littleEndian parameter
 * - Corresponds to `DataView.getFloat32()` and `DataView.setFloat32()`
 */
export const FLOAT_32 = defineType<number>("FLOAT_32")
    .setSize(4)
    .setGetter(({ view, offset, littleEndian }) => view.getFloat32(offset, littleEndian))
    .setSetter(({ view, offset, littleEndian }, value) => view.setFloat32(offset, value, littleEndian));

/** Alias for {@link FLOAT_32} */
export const FLOAT = FLOAT_32.clone("FLOAT");

/**
 * Double-precision (64-bit) floating-point type descriptor
 * 
 * @remarks
 * - Size: 8 bytes
 * - Range: ±1.8e308
 * - Precision: ~15 decimal digits
 * - Endian-sensitive: Uses littleEndian parameter
 * - Corresponds to `DataView.getFloat64()` and `DataView.setFloat64()`
 */
export const FLOAT_64 = defineType<number>("FLOAT_64")
    .setSize(8)
    .setGetter(({ view, offset, littleEndian }) => view.getFloat64(offset, littleEndian))
    .setSetter(({ view, offset, littleEndian }, value) => view.setFloat64(offset, value, littleEndian));

/** Alias for {@link FLOAT_64} */
export const DOUBLE = FLOAT_64.clone("DOUBLE");
