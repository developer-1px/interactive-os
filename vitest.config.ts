import { defineConfig } from "vitest/config";

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
    ],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
