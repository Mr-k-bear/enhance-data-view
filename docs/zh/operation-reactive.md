---
title: 响应式读写
createTime: 2025/07/29 02:39:31
permalink: /zh/operation-reactive/
---

# 响应式读写

EDataView 的核心能力是提供 ArrayBuffer 的响应式数据访问。通过强大的 reactive/ref 函数，您可以将 DataView 中的任意数据类型映射为 JavaScript 的 Proxy 对象。

所有针对 Proxy 对象的操作都将响应式地同步至原始 ArrayBuffer，这一特性尤其适用于处理 WebAssembly (WASM) 内存中的动态数据。

```typescript
import { defineStruct, reactive, types } from "enhance-data-view";

// 使用链式API定义结构体类型
const MyStruct = defineStruct()
    .addProperty("foo", types.UINT_8)
    .addProperty("bar", types.FLOAT_32)
    .freeze();

const dataView = new DataView(new ArrayBuffer(MyStruct.size));
// 将 DataView 转换为响应式代理对象
const data = reactive(dataView, MyStruct, 0);
// 修改直接写入 DataView
data.bar = 1;
// 属性读取操作将实时从 DataView 获取最新值
console.log(data.bar);
```

当处理原始值类型（如 number/boolean）时，直接使用 reactive 会失效，因为 JavaScript 的代理机制无法劫持原始值的直接赋值操作，此时必须使用 ref 函数。

```typescript
import { reactive, ref, types } from "enhance-data-view";
const dataView = new DataView(types.FLOAT_32.size);

// ❌ 值类型陷阱：reactive 仅适用于对象
let data = reactive(dataView, types.FLOAT_32, 0);
// 此操作不会同步写入至 DataView
data = 1;

// ✅ 值类型解决方案：使用 ref 包装
let refData = ref(dataView, types.FLOAT_32, 0);
// 自动写入 DataView
refData.value = 1;
```

### 全量读写

批量读写数据结构时，响应式操作的逐属性访问模式会带来显著性能开销。此时应使用 get/set 函数进行高效的单次操作。

```typescript
import { defineArray, defineStruct, reactive, get, types } from "enhance-data-view";

const MyStruct = defineStruct()
    .addProperty("foo", types.UINT_8)
    .addProperty("bar", types.FLOAT_32)
    .freeze();
const MyArray = defineArray(MyStruct, 1000).freeze();
// 长度为 1000 的结构体数组
const dataView = new DataView(new ArrayBuffer(MyArray.size));

// ❌ 低效操作：通过响应式代理遍历大量数据
const reactiveData = reactive(dataView, MyArray, 0);
for (let i = 0; i < reactiveData.length; i++) {
    console.log(reactiveData[i].foo);
    console.log(reactiveData[i].bar);
}

// ✅ 高效方案：使用get进行批量读取
const allData = get(dataView, MyArray, 0);
for (let i = 0; i < allData.length; i++) {
    console.log(allData[i].foo);
    console.log(allData[i].bar);
}
```

EDataView 还提供 toRaw 函数用于从响应式代理中高效提取原始数据对象，支持全量深拷贝读取。

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
// 嵌套结构体的响应式代理
const data = reactive(dataView, MyStruct, 0);
// 使用 toRaw 高效提取嵌套结构体数据
// 优势：避免代理层开销，直接获取深拷贝对象
const bar = toRaw(data.bar);
```