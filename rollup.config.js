import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default defineConfig([
    {
        input: "src/index.ts",
        output: [
            {
                format: "esm",
                file: "dist/index.esm.js"
            },
            {
                format: "cjs",
                file: "dist/index.cjs.js"
            },
            {
                format: "umd",
                name: "EDataView",
                file: "dist/index.umd.js"
            }
        ],
        plugins: [
            typescript({
                tsconfig: "./tsconfig.app.json"
            })
        ]
    },
    {
        input: "src/index.ts",
        output: {
            format: "umd",
            name: "EDataView",
            file: "dist/index.umd.mini.js"
        },
        plugins: [
            typescript({
                tsconfig: "./tsconfig.app.json"
            }),
            terser()
        ]
    }
]);