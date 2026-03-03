import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@kernel": "/packages/kernel/src",
      "@os-core": "/packages/os-core/src",
      "@os-react": "/packages/os-react/src",
      "@os-sdk": "/packages/os-sdk/src",
      "@os-devtool": "/packages/os-devtool/src",
      "@apps": "/src/apps",
      "@inspector": "/src/inspector",
      "@": "/src",
    },
  },
  test: {
    include: [
      "src/**/__tests__/unit/**/*.test.ts",
      "src/**/__tests__/unit/**/*.test.tsx",
      "packages/**/__tests__/unit/**/*.test.ts",
      "packages/**/__tests__/unit/**/*.test.tsx",
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
    ],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
