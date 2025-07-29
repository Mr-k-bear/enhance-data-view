---
title: 快速上手
createTime: 2025/07/25 08:01:12
permalink: /zh/quick-start/
---

# 快速上手

我们将尝试使用 EDataView 编写一段二进制操作逻辑，来快速入门。

## 安装

使用您喜欢的包管理工具安装 `enhanced-data-view` 依赖。

```bash
# npm
npm i enhanced-data-view
# pnpm
pnpm add enhanced-data-view
# yarn
yarn add enhanced-data-view
```

从 CDN 上加载 EDataView，请使用全局变量 `EDataView` 来访问其 API。

```html
<script src="https://cdn.jsdelivr.net/npm/enhance-data-view/dist/index.umd.mini.js"></script>
```

## 类型描述符

二进制数据无法像 JSON 数据那样直接操作，这是因为纯粹的二进制数据中通常不包含类型信息，想要正确读取它们，就要先告诉 EDataView 你要读取的数据是什么类型。

EDataView 中提供了一些以 `define` 开头的函数，用于创建一种用于描述特定类型的对象，我们将这些对象称为 `类型描述符`。

```typescript
import { defineString } from "enhance-data-view";

// 定义一个长度为 10 字节，且未使用部分用 0(NULL) 填充的字符串。
const STRING_10 = defineString(10, 0).freeze();
```

> 为了和其他对象做区分，我们建议 `类型描述符` 的变量命名采用：全大写单词+下划线(_)

所有的 `define` 函数都支持链式调用，您可以在后续的调用中修改参数，实现更加灵活的配置。

```typescript
import { defineString } from "enhance-data-view";

const STRING_16 = defineString()
    // 设置大小 16
    .setSize(16)
    // 设置未使用部分填充内容
    .setFiller(0)
    // 创建不可变副本
    .freeze();
```

在确定最终修改后请调用 `freeze()` 函数，创建当前 `类型描述符` 的不可变副本，以防止后续误修改。

> 如果您想修改不可变副本，可以在不可变副本上调用 `clone()`，这将从不可变副本上创建可变副本。

## 基础类型

EDataView 中预定义了部分常见类型的 `类型描述符`，您可以直接导入它们：

```typescript
import { UINT_32, FLOAT_32 } from "enhance-data-view";
```

您也可以通过 `types` 一次性将它们全部导入：

```typescript
import { types } from "enhance-data-view";

types.UINT_32;
types.FLOAT_32;
```

## 复杂类型定义

我们可以组合这些 `define` 函数来快速定义出复杂的 `类型描述符`。

```typescript
import { defineArray, defineString, defineStruct, types } from "enhance-data-view";

// 定义结构体类型
const PERSON = defineStruct()
    // id 属性：UINT_32 类型
    .addProperty("id", types.UINT_32)
    // name 属性：长度为 10 的字符串类型
    .addProperty("name", defineString(10, 0).freeze())
    // friends 属性：长度为 4 的 UINT_32 数组类型
    .addProperty("friends", defineArray(types.UINT_32, 4).freeze())
    .freeze();
```

这就类似于静态语言中的类型声明，就像 C/C++：

```c++
#include <cstdint>

struct PERSON {
    uint32_t id;
    char name[10];
    uint32_t friends[4];
};
```

## 响应式操作

下面使用刚刚定义好的 `PERSON` 类型完成二进制操作。

先准备一个 `DataView`，用于保存二进制的 `PERSON` 数据，其缓冲区大小为 `PERSON` 类型的大小，通过访问 `类型描述符` 对象上的 `size` 属性来获取其字节大小。

```typescript
// 使用 'StructPerson.size' 来获取类型的字节大小
const dataView = new DataView(new ArrayBuffer(PERSON.size));
```

调用 `reactive` 函数，将 `DataView` 中偏移量为 `0` 处 `PERSON` 类型的区域（第四个参数表示是否为小端序），转换为响应式对象。


```typescript
import { reactive } from "enhance-data-view";

// Make dataView reactive ✨
const person = reactive(dataView, PERSON, 0, true);

// 向 DataView 写入数据
person.id = 1;
person.name = "MrKBear";
person.friends = [2, 3, 4, 5];
person.friends[1] = 0xff;
```

对 `person` 对象的任何写入操作将直接作用于 `DataView` 中的缓冲区。

我们将鼠标悬停在 `person` 上，可以看到 `Typescript` 已经正确识别到类型：

```typescript
const person: {
    id: number;
    name: string;
    friends: number[];
}
```

此时，我们查看 `dataView.buffer`，发现数据已经被正确写入。

```typescript
console.log(dataView.buffer);
// <01 00 00 00 
//  4d 72 4b 42 65 61 72 00 00 00 00 00
//  02 00 00 00 ff 00 00 00 04 00 00 00 05 00 00 00>
```

相对的，对 `person` 对象的任何读取操作，将实时的从 `DataView` 中读取并解析。

```typescript
console.log(person.id); // 1
console.log(person.name); // MrKBear
console.log(person.friends[1]); // 255
```

## 将响应式对象转换为原始对象

如果您想一次性获取 `person` 中的全部数据，而不是随着属性的读取实时获取。

可以通过 `toRaw` 函数将响应式对象转换为原始对象。

```typescript
import { toRaw } from "enhance-data-view";

// 转换为原始对象
console.log(toRaw(person)); // { id: 1, name: "MrKBear", friends: [2, 255, 4, 5] }
// 仅转换部分数据
console.log(toRaw(person.friends)); // [2, 255, 4, 5]
```

## 完整示例

```typescript
import { defineArray, defineString, defineStruct, types, reactive, toRaw } from "enhance-data-view";

// 定义结构体类型
const PERSON = defineStruct()
    // id 属性：UINT_32 类型
    .addProperty("id", types.UINT_32)
    // name 属性：长度为 10 的字符串类型
    .addProperty("name", defineString(10, 0).freeze())
    // friends 属性：长度为 4 的 UINT_32 数组类型
    .addProperty("friends", defineArray(types.UINT_32, 4).freeze())
    .freeze();

// 使用 'PERSON.size' 来获取类型的字节大小
const dataView = new DataView(new ArrayBuffer(PERSON.size));
// Make dataView reactive ✨
const person = reactive(dataView, PERSON, 0, true);
// Typescript 自动推断出 person 的类型如下: 
// const person: {
//     id: number;
//     name: string;
//     friends: number[];
// }

// 向 DataView 写入数据
person.id = 1;
person.name = "MrKBear";
person.friends = [2, 3, 4, 5];
person.friends[1] = 0xff;

// 从 dataView 中读取数据
console.log(dataView.buffer);
// <01 00 00 00 
//  4d 72 4b 42 65 61 72 00 00 00 00 00
//  02 00 00 00 ff 00 00 00 04 00 00 00 05 00 00 00>
console.log(person.id); // 1
console.log(person.name); // MrKBear
console.log(person.friends[1]); // 255
// 转换为原始对象
console.log(toRaw(person)); // { id: 1, name: "MrKBear", friends: [2, 255, 4, 5] }
console.log(toRaw(person.friends)); // [2, 255, 4, 5]
```

@[demo vue](../demo/quick-start.vue)
