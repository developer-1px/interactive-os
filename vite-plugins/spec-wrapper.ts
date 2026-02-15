import type { Plugin } from "vite";

/**
 * Vite Plugin: Spec Wrapper
 *
 * Transforms .spec.ts files so that their top-level side-effects
 * (test(), test.describe()) are wrapped in an `export default function`.
 *
 * Before:
 *   import { test, expect } from "@playwright/test";
 *   test.describe("Tabs", () => { ... });
 *
 * After:
 *   import { test, expect } from "@playwright/test";
 *   import { setLoadingContext as __setCtx__ } from "@inspector/testbot/playwright/registry";
 *   export default function __runSpec__() {
 *     __setCtx__("e2e/aria-showcase/tabs.spec.ts");
 *     test.describe("Tabs", () => { ... });
 *     __setCtx__(null);
 *   }
 */
export function specWrapperPlugin(): Plugin {
  return {
    name: "spec-wrapper",
    enforce: "pre",

    transform(code, id) {
      if (!id.endsWith(".spec.ts")) return null;

      // Skip specs that use Node.js APIs (e.g. smoke.spec.ts) — they are
      // Playwright-only and cannot be bundled for the browser / TestBot.
      // Return an empty module so the build graph doesn't choke on node: imports.
      if (id.includes("smoke.spec.ts")) {
        return {
          code: "export default function __runSpec__() {}",
          map: null,
        };
      }

      // Extract relative path from project root for context tagging
      // e.g. "/Users/.../e2e/aria-showcase/tabs.spec.ts" → "e2e/aria-showcase/tabs.spec.ts"
      const e2eIndex = id.indexOf("e2e/");
      const relativePath = e2eIndex >= 0 ? id.slice(e2eIndex) : id;

      const lines = code.split("\n");
      const importLines: string[] = [];
      const bodyLines: string[] = [];

      let inImports = true;
      for (const line of lines) {
        // Collect all import lines (including multi-line)
        if (
          inImports &&
          (line.startsWith("import ") ||
            line.trim() === "" ||
            line.startsWith("//")) &&
          bodyLines.length === 0
        ) {
          importLines.push(line);
        } else {
          inImports = false;
          bodyLines.push(line);
        }
      }

      const transformed = [
        ...importLines,
        `import { setLoadingContext as __setCtx__ } from "@inspector/testbot/playwright/registry";`,
        `export default function __runSpec__() {`,
        `  __setCtx__(${JSON.stringify(relativePath)});`,
        ...bodyLines.map((l) => `  ${l}`),
        `  __setCtx__(null);`,
        `}`,
        `__runSpec__.sourceFile = ${JSON.stringify(relativePath)};`,
      ].join("\n");

      return { code: transformed, map: null };
    },
  };
}
