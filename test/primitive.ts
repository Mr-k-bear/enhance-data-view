import { types, get, set, getArray, setArray } from "enhance-data-view";

describe("Primitive types read/write operations", () => {
    const testCases: Array<[
        string,
        any,
        number | bigint | string,
        number
    ]> = [
            ["INT_8", types.INT_8, -42, 1],
            ["INT_16", types.INT_16, -2048, 2],
            ["INT_32", types.INT_32, -100000, 4],
            ["INT_64", types.INT_64, -123456789012345n, 8],
            ["UINT_8", types.UINT_8, 200, 1],
            ["UINT_16", types.UINT_16, 45000, 2],
            ["UINT_32", types.UINT_32, 3000000000, 4],
            ["UINT_64", types.UINT_64, 123456789012345n, 8],
            ["CHAR", types.CHAR, "A", 1],
            ["FLOAT_16", types.FLOAT_16, 3.14, 2],
            ["FLOAT_32", types.FLOAT_32, 123.456, 4],
            ["FLOAT_64", types.FLOAT_64, 123456.789012, 8],
        ];

    describe.each(testCases)(
        "Little-endian: %s",
        (typeName, typeDef, testValue, byteSize) => {
            it(`should read/write ${typeName} correctly`, () => {
                const buffer = new ArrayBuffer(byteSize);
                const view = new DataView(buffer);
                set(view, typeDef, 0, testValue, true);
                const result = get(view, typeDef, 0, true);
                if (typeof testValue === "number") {
                    if (typeName === "FLOAT_16" || typeName === "FLOAT_32" || typeName === "FLOAT_64") {
                        expect(result).toBeCloseTo(testValue as number, 2);
                    } else {
                        expect(result).toBe(testValue);
                    }
                } else {
                    expect(result).toEqual(testValue);
                }
            });
        }
    );

    describe.each(testCases)(
        "Big-endian: %s",
        (typeName, typeDef, testValue, byteSize) => {
            it(`should read/write ${typeName} correctly`, () => {
                const buffer = new ArrayBuffer(byteSize);
                const view = new DataView(buffer);
                set(view, typeDef, 0, testValue, false);
                const result = get(view, typeDef, 0, false);
                if (typeof testValue === "number") {
                    if (typeName === "FLOAT_16" || typeName === "FLOAT_32" || typeName === "FLOAT_64") {
                        expect(result).toBeCloseTo(testValue as number, 2);
                    } else {
                        expect(result).toBe(testValue);
                    }
                } else {
                    expect(result).toEqual(testValue);
                }
            });
        }
    );
});

describe("Array types read/write operations", () => {
    const arrayTestCases: Array<[
        string,
        any,
        Array<number | bigint | string>,
        number,
        number
    ]> = [
            ["INT_8 array", types.INT_8, [-1, 0, 1, 127, -128], 1, 5],
            ["UINT_16 array", types.UINT_16, [100, 200, 300, 400], 2, 4],
            ["FLOAT_32 array", types.FLOAT_32, [1.1, 2.2, 3.3, 4.4], 4, 4],
            ["CHAR array", types.CHAR, ["A", "B", "C", "D"], 1, 4],
        ];

    describe.each(arrayTestCases)(
        "%s",
        (testName, typeDef, testArray, elementSize, arrayLength) => {
            it("should read/write array correctly", () => {
                const buffer = new ArrayBuffer(elementSize * arrayLength);
                const view = new DataView(buffer);
                setArray(view, typeDef, 0, testArray, true);
                const result = getArray(view, typeDef, 0, arrayLength, true);
                if (typeof testArray[0] === "number" && testName.includes("FLOAT")) {
                    for (let i = 0; i < arrayLength; i++) {
                        expect(result[i]).toBeCloseTo(testArray[i] as number, 2);
                    }
                } else {
                    expect(result).toEqual(testArray);
                }
            });
        }
    );

    it("should handle large arrays correctly", () => {
        const length = 1000;
        const buffer = new ArrayBuffer(length * 4);
        const view = new DataView(buffer);
        const testArray = Array.from({ length }, (_, i) => i * 10);
        setArray(view, types.INT_32, 0, testArray, true);
        const result = getArray(view, types.INT_32, 0, length, true);
        expect(result.length).toBe(length);
        expect(result).toEqual(testArray);
    });
});