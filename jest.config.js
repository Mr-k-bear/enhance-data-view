import { createDefaultPreset } from "ts-jest";

const preset = createDefaultPreset({
    tsconfig: "./tsconfig.test.json"
});

/** @type {import("jest").Config} **/
export default {
    testEnvironment: "node",
    testMatch: [
        "<rootDir>/test/**/*"
    ],
    transform: {
        ...preset.transform,
    },
    moduleNameMapper: {
        "^enhance-data-view$": "<rootDir>/src/index.ts"
    }
};