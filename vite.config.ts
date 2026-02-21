import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import inspectorBabelPlugin from "./vite-plugins/babel-inspector";
import { inspectorPlugin } from "./vite-plugins/inspector";
import { specWrapperPlugin } from "./vite-plugins/spec-wrapper";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    specWrapperPlugin(),
    react({
      babel: {
        plugins: [inspectorBabelPlugin],
      },
    }),
    tailwindcss(),
    inspectorPlugin(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: "exclude-spec-files",
          setup(build) {
            build.onResolve({ filter: /\.spec\.ts$/ }, (args) => ({
              path: args.path,
              external: true,
            }));
          },
        },
      ],
    },
  },
  server: {
    port: 5555,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@playwright/test": "/src/inspector/testbot/playwright/index.ts",
      "vitest": "/src/inspector/testbot/vitest/index.ts",
      "@inspector": "/src/inspector",
      "@kernel": "/packages/kernel/src",
      "@os": "/src/os",
      "@apps": "/src/apps",
      "@": "/src",
    },
  },
});
