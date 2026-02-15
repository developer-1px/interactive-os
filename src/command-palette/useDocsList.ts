/**
 * useDocsList — Extract docs file entries for CommandPalette search.
 *
 * Reads from the same `import.meta.glob` used by DocsViewer,
 * and returns a flat list of searchable doc entries.
 */

import { useMemo } from "react";
import { cleanLabel, docsModules } from "@/docs-viewer/docsUtils";

export interface DocEntry {
  /** Navigation target: /docs/{relativePath} */
  path: string;
  /** Human-readable label from file path */
  label: string;
  /** Category from top-level folder (e.g. "inbox", "project", "discussions") */
  category: string;
}

export function useDocsList(): DocEntry[] {
  return useMemo(() => {
    const entries: DocEntry[] = [];

    for (const globPath of Object.keys(docsModules)) {
      const relativePath = globPath
        .replace(/^.*\/docs\//, "")
        .replace(/\.md$/, "");

      const parts = relativePath.split("/");
      const fileName = parts[parts.length - 1] ?? relativePath;
      const category = parts[0] ?? "";

      entries.push({
        path: `/docs/${relativePath}`,
        label: `${cleanLabel(category)} / ${cleanLabel(fileName)}`,
        category: cleanLabel(category),
      });
    }

    entries.sort((a, b) => a.label.localeCompare(b.label));
    return entries;
  }, []);
}
