import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";

export default defineConfig({
    input: "src/index.ts",
    output: {
        dir: "dist",
        format: "esm"
    },
    plugins: [
        typescript({
            tsconfig: "./tsconfig.app.json"
        })
    ]
});