import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { inspectorPlugin } from "./vite-plugins/inspector";
import inspectorBabelPlugin from "./vite-plugins/babel-inspector";

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
