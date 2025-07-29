---
title: 结构体类型
createTime: 2025/07/29 02:34:40
permalink: /zh/define-struct/
---

# 结构体类型

通过 `defineStruct` 函数创建结构体:

```typescript
import { defineStruct, types } from "enhance-data-view";

// 链式声明写法
const MyStruct = defineStruct()
    .addProperty("foo", types.UINT_8)
    .addProperty("bar", types.FLOAT_32)
    .freeze(); // 冻结定义，提高性能，防止后续错误修改

// 配置对象写法
const MyStruct = defineStruct({
    foo: types.UINT_8,
    bar: types.FLOAT_32
}).freeze();
```

我们更推荐 `链式声明` 写法, 因为链式声明更加灵活和安全。

### 结构体两种声明方法对比

虽然 `配置对象` 写法直观清晰，但 JavaScript 对象属性的枚举顺序可能与声明顺序不一致（底层依赖 Object.entries 的顺序），而内存布局严格依赖字段顺序。

为确保顺序确定性，可使用 `defineProperty` 显式指定 order 参数。

```typescript
import { defineStruct, defineProperty, types } from "enhance-data-view";

const MyStruct = defineStruct({
    foo: defineProperty(types.UINT_8, { order: 0 }),
    bar: defineProperty(types.FLOAT_32, { order: 1 })
}).freeze();
```

### 结构体布局计算

结构体内存布局会根据属性类型的对齐要求（align）自动计算。`defineStruct` 会自动插入填充字节以满足所有属性的对齐需求，行为类似静态语言编译器。

> 如果您尝试打印 `MyStruct.size`, 得到的结果不是 5, 而是 8, 因为 `defineStruct` 自动在 `UINT_8` 后面添加了 3 个字节的填充, 以满足 `FLOAT_32` 的对齐需求）

每个类型都有预定义的对齐值，也可通过 `align` 参数显式覆盖该值以创建紧凑布局:

```typescript
import { defineStruct, defineProperty, types } from "enhance-data-view";

// 链式声明写法
const MyCompactStruct = defineStruct()
    .addProperty("foo", types.UINT_8, { align: 1 })
    .addProperty("bar", types.FLOAT_32, { align: 1 })
    .freeze();

// 配置对象写法
const MyCompactStruct = defineStruct({
    foo: defineProperty(types.UINT_8, { order: 0, align: 1 }),
    bar: defineProperty(types.FLOAT_32, { order: 1, align: 1 })
}).freeze();
```

> 此时打印 `MyCompactStruct.size` 得到的值是 5

### 结构体填充属性

某些场景下，可能仅需操作结构体内的部分字段。此时可通过 `填充字段` 或 `手动布局` 跳过无关数据区域，实现精确内存定位。

例如：从结构体第 32 字节偏移处访问 `foo` 和 `bar` :

```typescript
import { defineStruct, defineProperty, definePadding, types } from "enhance-data-view";

// 链式声明写法
const MyLayoutStruct = defineStruct()
    // 手动插入 32 字节填充
    .addPadding("p", 32)
    .addProperty("foo", types.UINT_8)
    .addProperty("bar", types.FLOAT_32)
    .freeze();

// 配置对象写法
const MyLayoutStruct = defineStruct({
    // 手动插入 32 字节填充
    p: definePadding(32),
    foo: defineProperty(types.UINT_8),
    bar: defineProperty(types.FLOAT_32)
}).freeze();
```

### 结构体填充属性

若自动布局无法满足复杂需求，defineStruct 支持手动布局模式：通过直接指定字段偏移量来精确控制内存布局，完全绕过自动计算机制。

无论采用自动或手动布局，defineStruct 都会智能计算结构体总大小。

> 如示例中 `MyLayoutStruct.size` 将正确返回 40 字节

```typescript
import { defineStruct, defineProperty, types } from "enhance-data-view";

// 链式声明写法
const MyLayoutStruct = defineStruct()
    .addProperty("foo", types.UINT_8, { offset: 0x20 })
    .addProperty("bar", types.FLOAT_32, { offset: 0x24 })
    .freeze();

// 配置对象写法
const MyLayoutStruct = defineStruct({
    foo: defineProperty(types.UINT_8, { offset: 0x20 }),
    bar: defineProperty(types.FLOAT_32, { offset: 0x24 })
}).freeze();
```
