import js from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";

export default [
    {
        ignores: ["node_modules/", ".venv/", "dist/", ".astro/"]
    },
    js.configs.recommended,
    ...eslintPluginAstro.configs.recommended,
    {
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "off", // Astro globals and inline scripts often trigger this
        }
    },
    {
        files: ["**/*.astro"],
        languageOptions: {
            parserOptions: {
                parser: "@typescript-eslint/parser",
                extraFileExtensions: [".astro"],
            },
        },
    }
];
