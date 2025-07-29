# 数组类型

通过 `defineArray` 函数定义数组类型:

```typescript
import { defineArray, types } from "enhance-data-view";

// 长度为 4 的 FLOAT_32 数组
const MyArray = defineArray(types.FLOAT_32, 4).freeze();
// 长度为 16 的结构体数组
const MyStructArray = defineArray(MyStruct, 16).freeze();
// 二维数组
const My2DArray = defineArray(MyArray, 2).freeze();
```