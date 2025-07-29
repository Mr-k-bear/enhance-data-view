# 字符串类型

通过 `defineString` 函数定义字符串类型:

```typescript
import { defineString } from "enhance-data-view";

// 定义一个长度为 10 的字符串, 未使用空间使用 0 (NULL) 填充
const MyString = defineString(10, 0).freeze();
```

### 字符串字符集

默认情况下, `defineString` 使用 UTF-8 字符集（基于 TextEncoder/TextDecoder 实现）。

如需支持其他字符集，可通过自定义编解码器灵活扩展。

例如使用 `iconv-lite` 完成 GBK 字符集读取与写入：

```typescript
import iconv from "iconv-lite";
import { defineString, ref } from "enhance-data-view";

const GBKString = defineString(12)
// 使用iconv-lite提供的编码/解码器
.setCoder({
    encode: string => new Uint8Array(iconv.encode(string, "GBK")),
    decode: buffer => iconv.decode(Buffer.from(buffer), "GBK")
});
const dataView = new DataView(new ArrayBuffer(GBKString.size));
const string = ref(dataView, GBKString, 0);
string.value = "你好";
```