import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";
import pipelinePlugin from "./eslint-plugin-pipeline/index.js";

export default defineConfig([
  globalIgnores(["dist", "coverage"]),
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
      "pipeline/no-dispatch-in-tsx": "error",
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  // Framework code (os-react listeners, projections) legitimately dispatches — not L2 app code
  // Inspector, docs-viewer, showcase patterns are standalone/demo — not standard app L2
  {
    files: [
      "packages/os-react/**/*.tsx",
      "packages/surface/**/*.tsx",
      "src/inspector/**/*.tsx",
      "src/docs-viewer/**/*.tsx",
      "src/pages/apg-showcase/patterns/*.tsx",
    ],
    rules: {
      "pipeline/no-dispatch-in-tsx": "off",
      "react-refresh/only-export-components": "off",
    },
  },
  // OS framework & kernel use advanced ref patterns (callback ref merging, selector refs)
  {
    files: [
      "packages/os-react/**/*.{ts,tsx}",
      "packages/kernel/**/*.{ts,tsx}",
      "src/inspector/**/*.{ts,tsx}",
    ],
    rules: {
      "react-hooks/refs": "off",
    },
  },
  // Vite plugins & dev tooling — relaxed rules (not app code)
  {
    files: ["vite-plugins/**/*.{ts,tsx}"],
    rules: {
      "pipeline/no-dispatch-in-tsx": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Showcase/test-suite patterns export both App config + Component — intentional
  // Route files export Route object + component — TanStack Router convention
  {
    files: [
      "src/pages/apg-showcase/patterns/*.tsx",
      "src/pages/layer-showcase/patterns/*.tsx",
      "src/pages/os-test-suite/patterns/*.tsx",
      "src/routes/**/*.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  // Allow _ prefix for unused vars (destructuring, intentional ignoring)
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
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
  {
    files: ["src/apps/**/*.{ts,tsx}", "src/pages/**/*.{ts,tsx}"],
    ignores: ["src/inspector/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@os-core/*"],
              message:
                "src/ 에서 @os-core/* 직접 import 금지. @os-sdk/os facade를 사용하세요 (rules.md §1).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.tsx"],
    ignores: [
      "src/inspector/**",
      "src/main.tsx",
      "src/docs-viewer/**",
      "src/pages/apg-showcase/patterns/*.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@os-sdk/os",
              importNames: ["os"],
              message:
                "React(.tsx)에서 os 객체 직접 사용 금지. accessor hook / Zone callback / Trigger를 사용하세요 (rules.md §1).",
            },
          ],
        },
      ],
    },
  },
]);
