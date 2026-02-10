import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import inspectorBabelPlugin from "./vite-plugins/babel-inspector";
import { specWrapperPlugin } from "./vite-plugins/spec-wrapper";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    specWrapperPlugin(),
    react({
      babel: {
        plugins: [inspectorBabelPlugin],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@playwright/test": "/src/os/testBot/playwright/index.ts",
      "@kernel": "/packages/kernel/src",
      "@os": "/src/os",
      "@apps": "/src/apps",
      "@": "/src",
    },
  },
});
