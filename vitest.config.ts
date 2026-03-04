/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
    test: {
        // 使用 happy-dom 提供 DOM API mock（localStorage, document 等）
        environment: "happy-dom",

        // 測試檔案位置
        include: ["tests/**/*.test.ts"],

        // 路徑別名（對齊 tsconfig.json 的 @/ → src/）
        alias: {
            "@/": resolve(__dirname, "src") + "/",
        },

        // 全域 setup（mock localStorage 等）
        setupFiles: ["tests/setup.ts"],

        // 覆蓋率報告
        coverage: {
            provider: "v8",
            include: ["src/scripts/**/*.ts"],
            exclude: [
                "src/scripts/generated/**",
                "src/scripts/**/*.d.ts",
            ],
        },
    },

    resolve: {
        alias: {
            "@/": resolve(__dirname, "src") + "/",
        },
    },
});
