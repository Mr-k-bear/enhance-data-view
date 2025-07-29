# DataView Enhanced (EDataView)

Enhanced DataView(EDataView) is a lightweight binary data manipulation library, rigorously written in TypeScript, providing a chained API for type definition and reactive data manipulation.

[![EDataView on npm](https://img.shields.io/npm/v/enhance-data-view.svg)](https://www.npmjs.com/package/enhance-data-view)
![MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Core Features

- **Declarative Type System:** Define complex data structures through a concise chained API, abstracting underlying binary operations
- **Automatic Memory Layout Calculation:** Intelligently handles memory alignment requirements, compatible with WASM modules compiled from static languages
- **Reactive Data Manipulation:** Based on Proxy implementation, supports partial modification of complex data structures
- **Precise Type Inference:** Type definitions automatically map to the TypeScript type system
- **Highly Extensible Architecture:** Interface-based API design supports flexible functionality extensions

## Installation

```bash
npm install enhanced-data-view
```

Using EDataView from CDN (jsdelivr)

```html
<script src="https://cdn.jsdelivr.net/npm/enhance-data-view/dist/index.umd.mini.js"></script>
<script>
const { defineArray, defineString, defineStruct, types, reactive, toRaw } = window.EDataView;
</script>
```

## Quick Start

```typescript
import { defineArray, defineString, defineStruct, types, reactive, toRaw } from "enhance-data-view";

// Define type
const StructPerson = defineStruct({
    id: types.UINT_32,
    name: defineString(10, 0).freeze(),
    friends: defineArray(types.UINT_32, 4).freeze()
}).freeze();

// Use 'StructPerson.size' to get the byte size of the type
const dataView = new DataView(new ArrayBuffer(StructPerson.size));
// Make dataView reactive ✨
const person = reactive(dataView, StructPerson, 0, true);
// TypeScript automatically infers the type of person as follows:
// const person: {
//     id: number;
//     name: string;
//     friends: number[];
// }

// Write data to DataView
person.id = 1;
person.name = "MrKBear";
person.friends = [2, 3, 4, 5];
person.friends[1] = 0xff;

// Read data from dataView
console.log(dataView.buffer);
// <01 00 00 00 
//  4d 72 4b 42 65 61 72 00 00 00 00 00
//  02 00 00 00 ff 00 00 00 04 00 00 00 05 00 00 00>
console.log(person.id); // 1
console.log(person.name); // MrKBear
console.log(toRaw(person.friends)); // [2, 255, 4, 5]
```

## Design Philosophy

EDataView is designed around two core issues:

- **Type Definition:** How to describe binary data structures
- **Data Manipulation:** How to perform binary read/write based on type definitions

## Type Definition

### Primitive Types

EDataView predefines various common types, supporting on-demand import or batch import:

```typescript
// Introduce all primitive types at once
import { types } from "enhance-data-view";
types.UINT_8;
types.FLOAT_32;

// Selective import
import { UINT_8, FLOAT_32 } from "enhance-data-view";
```

### Struct Types

Create structs through the `defineStruct` function:

```typescript
import { defineStruct, types } from "enhance-data-view";

// Chained declaration syntax
const MyStruct = defineStruct()
    .addProperty("foo", types.UINT_8)
    .addProperty("bar", types.FLOAT_32)
    .freeze(); // Freeze definition to improve performance and prevent subsequent erroneous modifications

// Configuration object syntax
const MyStruct = defineStruct({
    foo: types.UINT_8,
    bar: types.FLOAT_32
}).freeze();
```

We recommend the chained declaration syntax, as it is more flexible and secure.

### Array Types

Define array types through the `defineArray` function:

```typescript
import { defineArray, types } from "enhance-data-view";

// Array of FLOAT_32 with length 4
const MyArray = defineArray(types.FLOAT_32, 4).freeze();
// Array of structs with length 16
const MyStructArray = defineArray(MyStruct, 16).freeze();
// Two-dimensional array
const My2DArray = defineArray(MyArray, 2).freeze();
```

### String Types

Define string types through the `defineString` function:

```typescript
import { defineString } from "enhance-data-view";

// Define a string of length 10, unused space filled with 0 (NULL)
const MyString = defineString(10, 0).freeze();
```

## Binary Operations

### Reactive Read/Write

The core capability of EDataView is providing reactive data access to `ArrayBuffer`. Through the powerful `reactive`/`ref` functions, you can map any data type in DataView to a JavaScript Proxy object.

All operations on the Proxy object will be reactively synchronized to the original `ArrayBuffer`. This feature is particularly suitable for handling dynamic data in WebAssembly (WASM) memory.

```typescript
import { defineStruct, reactive, types } from "enhance-data-view";

// Define struct type using chained API
const MyStruct = defineStruct()
    .addProperty("foo", types.UINT_8)
    .addProperty("bar", types.FLOAT_32)
    .freeze();

const dataView = new DataView(new ArrayBuffer(MyStruct.size));
// Convert DataView to reactive proxy object
const data = reactive(dataView, MyStruct, 0);
// Modifications are directly written to DataView
data.bar = 1;
// Property read operations retrieve the latest value from DataView in real-time
console.log(data.bar);
```

When handling primitive value types (such as number/boolean), using reactive directly will fail because JavaScript's proxy mechanism cannot intercept direct assignment operations on primitive values. 

In this case, the ref function must be used.

```typescript
import { reactive, ref, types } from "enhance-data-view";
const dataView = new DataView(types.FLOAT_32.size);

// ❌ Value type trap: reactive only applies to objects
let data = reactive(dataView, types.FLOAT_32, 0);
// This operation will not synchronize to DataView
data = 1;

// ✅ Value type solution: use ref wrapper
let refData = ref(dataView, types.FLOAT_32, 0);
// Automatically writes to DataView
refData.value = 1;
```

### Bulk Read/Write

When reading/writing data structures in bulk, the property-by-property access pattern of reactive operations incurs significant performance overhead. In such cases, the get/set functions should be used for efficient single operations.

```typescript
import { defineArray, defineStruct, reactive, get, types } from "enhance-data-view";

const MyStruct = defineStruct()
    .addProperty("foo", types.UINT_8)
    .addProperty("bar", types.FLOAT_32)
    .freeze();
const MyArray = defineArray(MyStruct, 1000).freeze();
// Struct array with length 1000
const dataView = new DataView(new ArrayBuffer(MyArray.size));

// ❌ Inefficient operation: traversing large amounts of data through reactive proxy
const reactiveData = reactive(dataView, MyArray, 0);
for (let i = 0; i < reactiveData.length; i++) {
    console.log(reactiveData[i].foo);
    console.log(reactiveData[i].bar);
}

// ✅ Efficient solution: use get for batch reading
const allData = get(dataView, MyArray, 0);
for (let i = 0; i < allData.length; i++) {
    console.log(allData[i].foo);
    console.log(allData[i].bar);
}
```

EDataView also provides the `toRaw` function for efficiently extracting raw data objects from reactive proxies, supporting full deep copy reads.

```typescript
import { defineArray, defineStruct, reactive, toRaw, types } from "enhance-data-view";

const MyStruct = defineStruct()
    .addProperty("foo", types.UINT_8)
    .addProperty("bar", defineStruct()
        .addProperty("apple", types.UINT_8)
        .addProperty("banana", types.FLOAT_32)
        .freeze()
    ).freeze();
const dataView = new DataView(new ArrayBuffer(MyStruct.size));、
// Reactive proxy of nested struct
const data = reactive(dataView, MyStruct, 0);
// Use toRaw to efficiently extract nested struct data
// Advantage: avoids proxy layer overhead, directly obtains deep copy object
const bar = toRaw(data.bar);
```

## Advanced Section

### Comparison of Two Struct Declaration Methods

Although the configuration object syntax is intuitive and clear, the enumeration order of JavaScript object properties may be inconsistent with the declaration order (underlying dependency on `Object.entries` order), while memory layout strictly depends on field order.

To ensure order determinism, you can use `defineProperty` to explicitly specify the order parameter.

```typescript
import { defineStruct, defineProperty, types } from "enhance-data-view";

const MyStruct = defineStruct({
    foo: defineProperty(types.UINT_8, { order: 0 }),
    bar: defineProperty(types.FLOAT_32, { order: 1 })
}).freeze();
```

### Struct Layout Calculation

The struct memory layout is automatically calculated based on the alignment requirements (align) of property types. `defineStruct` automatically inserts padding bytes to meet the alignment requirements of all properties, similar to static language compilers.

> If you try to print `MyStruct.size`, the result is not 5, but 8, because `defineStruct` automatically adds 3 bytes of padding after `UINT_8` to meet the alignment requirements of `FLOAT_32`.

Each type has a predefined alignment value, which can also be explicitly overridden using the align parameter to create a compact layout:

```typescript
import { defineStruct, defineProperty, types } from "enhance-data-view";

// Chained declaration syntax
const MyCompactStruct = defineStruct()
    .addProperty("foo", types.UINT_8, { align: 1 })
    .addProperty("bar", types.FLOAT_32, { align: 1 })
    .freeze();

// Configuration object syntax
const MyCompactStruct = defineStruct({
    foo: defineProperty(types.UINT_8, { order: 0, align: 1 }),
    bar: defineProperty(types.FLOAT_32, { order: 1, align: 1 })
}).freeze();
```

> Now printing `MyCompactStruct.size` yields a value of 5

### Struct Padding Properties

In some scenarios, you may only need to manipulate certain fields within a struct. In this case, you can use padding fields or manual layout to skip irrelevant data areas and achieve precise memory positioning.

For example: accessing `foo` and `bar` from the 32 byte offset of the struct:

```typescript
import { defineStruct, defineProperty, definePadding, types } from "enhance-data-view";

// Chained declaration syntax
const MyLayoutStruct = defineStruct()
    // Manually insert 32 bytes of padding
    .addPadding("p", 32)
    .addProperty("foo", types.UINT_8)
    .addProperty("bar", types.FLOAT_32)
    .freeze();

// Configuration object syntax
const MyLayoutStruct = defineStruct({
    // Manually insert 32 bytes of padding
    p: definePadding(32),
    foo: defineProperty(types.UINT_8),
    bar: defineProperty(types.FLOAT_32)
}).freeze();
```

### Struct Padding Properties

If automatic layout cannot meet complex requirements, `defineStruct` supports manual layout mode: by directly specifying field offsets to precisely control memory layout, completely bypassing the automatic calculation mechanism.

Regardless of whether automatic or manual layout is used, `defineStruct` intelligently calculates the total size of the struct.

> For example, `MyLayoutStruct.size` in the example will correctly return 40 bytes

```typescript
import { defineStruct, defineProperty, types } from "enhance-data-view";

// Chained declaration syntax
const MyLayoutStruct = defineStruct()
    .addProperty("foo", types.UINT_8, { offset: 0x20 })
    .addProperty("bar", types.FLOAT_32, { offset: 0x24 })
    .freeze();

// Configuration object syntax
const MyLayoutStruct = defineStruct({
    foo: defineProperty(types.UINT_8, { offset: 0x20 }),
    bar: defineProperty(types.FLOAT_32, { offset: 0x24 })
}).freeze();
```

### String Character Set

By default, `defineString` uses the UTF-8 character set (based on `TextEncoder`/`TextDecoder` implementation).

If other character sets need to be supported, flexible extensions can be achieved through custom codecs.

For example, using `iconv-lite` to implement GBK character set reading and writing:

```typescript
import iconv from "iconv-lite";
import { defineString, ref } from "enhance-data-view";

const GBKString = defineString(12)
// Use encoder/decoder provided by iconv-lite
.setCoder({
    encode: string => new Uint8Array(iconv.encode(string, "GBK")),
    decode: buffer => iconv.decode(Buffer.from(buffer), "GBK")
});
const dataView = new DataView(new ArrayBuffer(GBKString.size));
const string = ref(dataView, GBKString, 0);
string.value = "你好";
```

## Contribution

Welcome to contribute to the project!

Whether it's submitting a Pull Request, proposing feature suggestions, or reporting encountered issues, each of your contributions will help build a more powerful EDataView!

Members:

- @MrKBear <mrkbear@qq.com,mrkbear@mrkbear.com>

## License

MIT License
