/**
 * 🎨 ESLint Premium Configuration
 * Project: Lunar Calendar (農民曆)
 *
 * Features:
 * - TypeScript & Astro Support
 * - Perfectionist (Automatic Sorting)
 * - Prettier Integration
 */

import js from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";
import perfectionist from "eslint-plugin-perfectionist";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        // Global ignores
        ignores: ["node_modules/", ".venv/", "dist/", ".astro/", "public/"],
    },
    // Base recommended configs
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...eslintPluginAstro.configs.recommended,

    // Perfectionist - Automatic sorting for "pretty" code
    perfectionist.configs["recommended-natural"],

    // Prettier integration (must be last to override)
    prettierRecommended,

    {
        // Custom rules & Overrides
        rules: {
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "no-undef": "off",
            "no-unused-vars": "off",

            "prettier/prettier": [
                "error",
                {
                    endOfLine: "auto",
                },
            ],
        },
    },
    {
        // Astro specific configuration
        files: ["**/*.astro"],
        languageOptions: {
            parserOptions: {
                extraFileExtensions: [".astro"],
                parser: tseslint.parser,
            },
        },
    },
    {
        // Declaration files specific rules
        files: ["**/*.d.ts"],
        rules: {
            "@typescript-eslint/triple-slash-reference": "off",
        },
    },
];
