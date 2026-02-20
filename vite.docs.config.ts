import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Rewrite "/" to "/docs.html" so it's the default page
    {
      name: "docs-html-fallback",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/" || req.url === "/index.html") {
            req.url = "/docs.html";
          }
          next();
        });
      },
    },
  ],
  // Separate dep cache from the main Vite server to prevent
  // "Invalid hook call" errors caused by shared pre-bundled React modules.
  cacheDir: "node_modules/.vite-docs",
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 4444,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: "docs.html",
    },
  },
});
