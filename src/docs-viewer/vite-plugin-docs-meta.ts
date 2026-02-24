import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/**
 * Scans docs/ directory and builds a map of { relativePath → mtime }.
 * relativePath matches the convention used by docsUtils (e.g. "0-inbox/some-doc").
 */
function collectDocsMeta(docsDir: string): Record<string, { mtime: number }> {
  const result: Record<string, { mtime: number }> = {};

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".md")) {
        const stat = fs.statSync(full);
        const rel = path.relative(docsDir, full).replace(/\.md$/, "");
        result[rel] = { mtime: stat.mtimeMs };
      }
    }
  }

  walk(docsDir);
  return result;
}

const VIRTUAL_ID = "virtual:docs-meta";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

export function docsMetaPlugin(): Plugin {
  let docsDir: string;

  return {
    name: "vite-plugin-docs-meta",

    configResolved(config) {
      docsDir = path.resolve(config.root, "docs");
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    load(id) {
      if (id !== RESOLVED_ID) return;
      const meta = collectDocsMeta(docsDir);
      return `export default ${JSON.stringify(meta)};`;
    },

    // HMR: invalidate virtual module when any .md file in docs/ changes
    configureServer(server) {
      server.watcher.on("change", (filePath) => {
        if (filePath.startsWith(docsDir) && filePath.endsWith(".md")) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: "full-reload" });
          }
        }
      });
    },
  };
}
