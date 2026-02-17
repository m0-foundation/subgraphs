import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{ts,mts,cts}"],
    plugins: {
      js,
      prettier: prettierPlugin,
      "@typescript-eslint": tseslint,
    },
    languageOptions: { parser: tsparser, sourceType: "module" },
    ignores: [
      "node_modules",
      "dist",
      "src/common/gql/**/*.types.ts"
    ],
    rules: {
      ...tseslint.configs.recommended?.rules,
      ...prettierConfig.rules,
      "@typescript-eslint/no-explicit-any": "off", // TODO: remove this rule and fix all errors
      "prettier/prettier": "error",
    },
  },
]);
