import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";
import pipelinePlugin from "./eslint-plugin-pipeline/index.js";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/vitest.setup.ts"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@testing-library/*"],
              message:
                "OS 위에서 OS를 테스트한다. @testing-library 금지 (rules.md #2).",
            },
          ],
        },
      ],
      "no-console": "warn",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      pipeline: pipelinePlugin,
    },
    rules: {
      "pipeline/no-pipeline-bypass": "error",
      "pipeline/no-direct-commit": "error",
      "pipeline/no-dom-in-commands": "error",
      "pipeline/no-full-state-useComputed": "error",
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ["src/apps/**/*.{ts,tsx}"],
    plugins: {
      pipeline: pipelinePlugin,
    },
    rules: {
      "pipeline/no-handler-in-app": "warn",
      "pipeline/no-imperative-handler": "warn",
    },
  },
]);
