import { definedType, definedStructure } from "enhance-data-view";
import type { TypeDefinedInfer } from "enhance-data-view";

const int_32 = definedType<number>("int_32")
  .setSize(4)
  .setGetter((view, offset, le) => view.getInt32(offset, le))
  .setSetter((view, offset, le, value) => view.setInt32(offset, value, le));
const S = definedType<string>("");
const N = definedType<number>("");
const A = definedType<{}>("");
const Q = definedStructure("")
.addProperty("foo", S)
.p("bar", N)
.p(1, A)
.o(definedType<undefined>(""))
.o(definedType<void>(""))
.o(definedType<undefined | void>(""))
.u("bar", A)
.removeProperty("foo")
type I = TypeDefinedInfer<typeof Q>;

test("hello", () => {
    expect(int_32.size).toBe(4);
});