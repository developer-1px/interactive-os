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
  server: {
    port: 4174,
  },
  build: {
    rollupOptions: {
      input: "docs.html",
    },
  },
});
