# 基础类型

EDataView 预定义了各种常见类型，支持按需引入或批量导入:

```typescript
// Introduce all primitive types at once
import { types } from "enhance-data-view";
types.UINT_8;
types.FLOAT_32;

// Selective import
import { UINT_8, FLOAT_32 } from "enhance-data-view";
```
