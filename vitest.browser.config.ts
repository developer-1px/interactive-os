import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import { TestBotReporter } from "./src/inspector/testbot/reporter/TestBotReporter";

/**
 * Vitest Browser Mode Configuration
 *
 * Runs the same .test.ts files in a real browser (Chromium via Playwright).
 * Usage: npx vitest run --config vitest.browser.config.ts
 *
 * Features:
 *   - Same tests, real browser (Chromium)
 *   - TestBotReporter writes testbot-report.json for visual replay
 */
export default defineConfig({
  resolve: {
    alias: {
      "@kernel": "/packages/kernel/src",
      "@os": "/src/os",
      "@apps": "/src/apps",
      "@inspector": "/src/inspector",
      "@": "/src",
    },
  },
  test: {
    include: [
      "src/**/tests/unit/**/*.test.ts",
      "src/**/tests/unit/**/*.test.tsx",
      "src/**/tests/integration/**/*.test.ts",
      "src/**/tests/integration/**/*.test.tsx",
      "src/**/tests/apg/**/*.test.ts",
      "packages/kernel/src/**/tests/unit/**/*.test.ts",
      "packages/kernel/src/**/tests/unit/**/*.test.tsx",
      "packages/kernel/src/**/tests/integration/**/*.test.ts",
      "packages/kernel/src/**/tests/integration/**/*.test.tsx",
    ],
    globals: true,
    reporters: ["default", new TestBotReporter()],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
      headless: true,
    },
  },
});
