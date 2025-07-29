# Enhanced DataView

Enhanced DataView(EDataView) 是一个轻量级二进制数据操作库，基于严谨的 Typescript 编写，提供链式 API 进行类型定义和响应式数据操作。

## 什么是 EDataView?

在 JavaScript 中操作 JSON 数据就如同呼吸一样简单。

```typescript
const person = {
    id: 1,
    name: "MrKBear",
    friends: [2, 3, 4, 5]
};
// 很简单
person.friends[1] = 6;
```

如果面对的是一堆纯粹的二进制数据，想要正确操作 (读/写) 它们，事情就没那么简单了。

```typescript
const personBlob = new Uint8Array([
    0x01, 0x00, 0x00, 0x00, 0x4d, 0x72, 0x4b, 0x42,
    0x65, 0x61, 0x72, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x02, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00,
    0x04, 0x00, 0x00, 0x00, 0x05, 0x00, 0x00, 0x00
]);
```

> 如果能像操作 JSON 数据那样操作二进制数据，岂不美哉？

EDataView 就是专为复杂二进制操作场景设计的，轻量化数据处理工具。

使用 EDataView 我们可以将二进制缓冲区，转换为响应式的 JavaScript 对象 (`Proxy`)，对响应式对象的任何操作将直接作用于二进制数据。

```typescript
const person = func_provided_by_EDataView(personBlob);
// 很简单
person.friends[1] = 6;
```

## 特色

- **声明式类型系统:** 通过简洁的链式 API 定义复杂数据结构，抽象底层二进制操作
- **自动内存布局计算:** 智能处理内存对齐需求，兼容静态语言编译的 WASM 模块
- **响应式数据操作:** 基于 Proxy 实现，支持复杂数据结构的局部修改
- **精确类型推断:** 类型定义自动映射到 TypeScript 类型系统
- **高拓展性架构:** 基于接口设计的 API，支持灵活的功能扩展

## 贡献者

- @MrKBear <mrkbear@qq.com,mrkbear@mrkbear.com>

感谢所有本项目的贡献者，支持者，以及看到这里的您。

欢迎参与项目贡献！无论是提交 Pull Request、提出功能建议，还是报告遇到的问题，您的每份参与都将助力更棒的 EDataView。💪

## 许可证

MIT License
