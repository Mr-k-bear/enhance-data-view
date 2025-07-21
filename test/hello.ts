import { definedType, definedStruct, CHAR, INT } from "enhance-data-view";
import type { TypeDefinedInfer } from "enhance-data-view";

const A = definedType<{}>("").setSize(10).setAlign(4);
const Q = definedStruct("")
.p("bar", CHAR)
.addProperty("foo", INT)
.u("foo", A)
.p(1, A)

type I = TypeDefinedInfer<typeof Q>;

test("hello", () => {
    expect(Q.size).toBe(28);
});

btoa