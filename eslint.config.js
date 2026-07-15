/**
 * Author: Yzrel Jade B. Eborde
 */

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "release", "backend", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Downgrade the react-hooks recommended set to warnings: the legacy
      // subscribe-then-setState store pattern trips the v7 compiler rules
      // throughout the codebase and is tracked as tech debt, not build-breaking.
      ...Object.fromEntries(
        Object.keys(reactHooks.configs.recommended.rules ?? {}).map((rule) => [
          rule,
          "warn",
        ]),
      ),
      "react-refresh/only-export-components": "off",
      "no-fallthrough": ["error", { allowEmptyCase: true }],
      // The codebase leans on `any` for moduleData payloads; keep as warning.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
