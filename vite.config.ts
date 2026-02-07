import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import inspectorBabelPlugin from "./vite-plugins/babel-inspector";
import { inspectorPlugin } from "./vite-plugins/inspector";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [inspectorBabelPlugin],
      },
    }),
    tailwindcss(),
    inspectorPlugin(),
  ],
  resolve: {
    alias: {
      "@os": "/src/os",
      "@apps": "/src/apps",
      "@": "/src",
    },
  },
});
