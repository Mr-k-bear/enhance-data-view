import { viteBundler } from "@vuepress/bundler-vite";
import { defineUserConfig } from "vuepress";
import { plumeTheme } from "vuepress-theme-plume";

export default defineUserConfig({
    title: "EDataView",
    lang: "en-US",
    bundler: viteBundler({
        viteOptions: {
            resolve: {
                alias: {
                    "enhance-data-view": "../../src/index.ts"
                }
            },
            server: {
                host: true,
                allowedHosts: true
            }
        }
    }),
    locales: {
        "/": { lang: "en-US" },
        "/zh/": { lang: "zh-CN" },
    },
    theme: plumeTheme({
        locales: {
            "/": {
                selectLanguageName: "English",
                navbar: [
                    { text: "Guide", link: "/" }
                ]
            },
            "/zh/": {
                selectLanguageName: "简体中文",
                sidebar: {
                    "/": [
                        {
                            text: "EDataView",
                            prefix: "/zh/",
                            items: [
                                "",
                                "quick-start",
                            ],
                            collapsed: false
                        },
                        {
                            text: "类型定义",
                            prefix: "/zh/",
                            items: [
                                "define-primitive",
                                "define-string",
                                "define-struct",
                                "define-array",
                            ],
                            collapsed: false
                        },
                        {
                            text: "数据操作",
                            prefix: "/zh/",
                            items: [
                                "operation-normal",
                                "operation-reactive"
                            ],
                            collapsed: false
                        }
                    ]
                },
                navbar: [
                    { text: "指南", link: "/zh/" }
                ]
            },
        },
        markdown: {
            demo: true,
        },
        notes: false,
    })
})