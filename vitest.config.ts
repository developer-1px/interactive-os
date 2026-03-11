import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@kernel": "/packages/kernel/src",
      "@os-core": "/packages/os-core/src",
      "@os-react": "/packages/os-react/src",
      "@os-sdk": "/packages/os-sdk/src",
      "@os-devtool": "/packages/os-devtool/src",
      "@os-testing": "/packages/os-testing/src",
      "@apps": "/src/apps",
      "@inspector": "/packages/os-devtool/src/inspector",
      "@": "/src",
      "virtual:docs-meta":
        "/tests/headless/apps/docs-viewer/__mocks__/docs-meta.ts",
      "virtual:agent-activity":
        "/tests/headless/apps/docs-viewer/__mocks__/agent-activity.ts",
    },
  },
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
