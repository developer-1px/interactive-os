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
    },
  },
]);
