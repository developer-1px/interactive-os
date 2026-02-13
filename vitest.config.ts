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
    include: ["src/**/tests/unit/**/*.test.ts"],
    environment: "jsdom",
    globals: true,
  },
});
