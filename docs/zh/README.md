# 介绍

Enhanced DataView (==EDataView==) 是一个专为高效处理二进制数据而设计的轻量级操作库。该库采用强类型设计的 TypeScript 构建，提供直观的链式 API 用于声明式地定义数据结构与类型，并基于此定义实现对底层 DataView 的读写操作以及响应式数据绑定与转换。

## 什么是 EDataView?

在 JavaScript 生态中，操作 JSON 格式的数据通常极为直观且简单，如同呼吸一般自然。

```typescript
const person = {
    id: 1,
    name: "MrKBear",
    friends: [2, 3, 4, 5]
};
// 很简单
console.log(person.name); // MrKBear
person.friends[1] = 6;
```

然而，面对原始二进制数据缓冲区时，进行精确的读写操作则会变得异常复杂且容易出错。

```typescript
const personBlob = new Uint8Array([
    0x01, 0x00, 0x00, 0x00, 0x4d, 0x72, 0x4b, 0x42,
    0x65, 0x61, 0x72, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x02, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00,
    0x04, 0x00, 0x00, 0x00, 0x05, 0x00, 0x00, 0x00
]);
```

> 试想：若能够如同操作 JSON 对象那样便捷地处理二进制数据，将为开发者带来极大的便利。

==EDataView== 正是为解决此类复杂二进制操作场景而专门设计的轻量级数据处理工具库。

借助 EDataView，开发者可以将底层的二进制缓冲区（ArrayBuffer）转换为==响应式==的 JavaScript 对象（基于 Proxy 实现）。

```typescript
const person = func_provided_by_EDataView(personBlob);
// 很简单
console.log(person.name); // MrKBear
person.friends[1] = 6;
```

对该响应式对象的任何属性访问或修改操作，都将被自动映射并直接作用于其底层的二进制数据源。

## 特色

- **声明式类型系统:** 通过简洁的链式 API 定义复杂数据结构，抽象底层二进制操作
- **自动内存布局计算:** 智能处理内存对齐需求，兼容静态语言编译的 WASM 模块
- **响应式数据操作:** 基于 Proxy 实现，支持复杂数据结构的局部修改
- **精确类型推断:** 类型定义自动映射到 TypeScript 类型系统
- **高拓展性架构:** 基于接口设计的 API，支持灵活的功能扩展

## 贡献者

::: card title="@MrKBear"
mrkbear@mrkbear.com
:::


感谢所有本项目的贡献者，支持者，以及看到这里的您。

欢迎参与项目贡献！无论是提交 Pull Request、提出功能建议，还是报告遇到的问题，您的每份参与都将助力更棒的 EDataView。

## 许可证

MIT License
