/**
 * DocsViewer Headless Test — real DocsViewer with Vite module mocks.
 *
 * Mocks:
 *   - virtual:docs-meta → alias to __mocks__/docs-meta.ts (vitest.config.ts)
 *   - @/docs-viewer/docsUtils → partial mock (docsModules + loadDocContent)
 *
 * Verifies:
 *   - DocsViewer can be imported and rendered in vitest (T1)
 *   - Tab cycle visits expected zones via projection (T2)
 *   - docs-reader items match the projected output (T2)
 */

import { describe, expect, it, vi } from "vitest";

// ── Mock docsUtils before any app imports ──
// Replace import.meta.glob-based docsModules with fake entries.
// We use a factory mock that re-exports everything except the Vite-specific parts.
vi.mock("@/docs-viewer/docsUtils", async () => {
  // Can't use importOriginal because docsUtils itself uses import.meta.glob.
  // Instead, inline the pure functions we need from docsUtils.
  // The key exports used by app.ts: docsModules, buildDocTree, flattenTree,
  // flattenVisibleTree, findFolder, getFavoriteFiles, toggleFavorite,
  // getRecentFiles, cleanLabel, formatRelativeTime, isFavorite, loadDocContent

  // Fake file entries
  const docsModules: Record<string, () => Promise<string>> = {
    "../../docs/STATUS.md": () => Promise.resolve("# STATUS"),
    "../../docs/0-inbox/test-doc.md": () => Promise.resolve("# Test Document"),
    "../../docs/1-project/sample.md": () => Promise.resolve("# Sample Project"),
  };

  interface DocItem {
    name: string;
    path: string;
    type: "file" | "folder";
    children?: DocItem[];
  }

  function buildDocTree(keys: string[]): DocItem[] {
    // Parse glob keys like "../../docs/STATUS.md" → "STATUS"
    const paths = keys
      .map((k) => k.replace("../../docs/", "").replace(/\.md$/, ""))
      .sort();

    const root: DocItem[] = [];
    const folders = new Map<string, DocItem>();

    for (const p of paths) {
      const parts = p.split("/");
      const name = parts[parts.length - 1]!;

      if (parts.length === 1) {
        root.push({ name, path: p, type: "file" });
      } else {
        // Ensure parent folders exist
        let parent = root;
        for (let i = 0; i < parts.length - 1; i++) {
          const folderPath = parts.slice(0, i + 1).join("/");
          let folder = folders.get(folderPath);
          if (!folder) {
            folder = {
              name: parts[i]!,
              path: folderPath,
              type: "folder",
              children: [],
            };
            folders.set(folderPath, folder);
            parent.push(folder);
          }
          parent = folder.children!;
        }
        parent.push({ name, path: p, type: "file" });
      }
    }
    return root;
  }

  function flattenTree(tree: DocItem[]): DocItem[] {
    const result: DocItem[] = [];
    for (const item of tree) {
      if (item.type === "file") result.push(item);
      if (item.children) result.push(...flattenTree(item.children));
    }
    return result;
  }

  interface FlatTreeNode {
    id: string;
    name: string;
    path: string;
    level: number;
    type: "folder" | "file";
    expandable: boolean;
  }

  function flattenVisibleTree(
    tree: DocItem[],
    expanded: string[],
    _depth = 0,
    _opts: { sectionLevel?: number } = {},
  ): FlatTreeNode[] {
    const sectionLevel = _opts.sectionLevel ?? -1;
    const result: FlatTreeNode[] = [];
    for (const item of tree) {
      if (item.type === "folder") {
        const folderId = `folder:${item.path}`;
        const hasChildren = !!item.children?.length;
        const isSection = _depth === sectionLevel;
        result.push({
          id: folderId,
          name: item.name,
          path: item.path,
          level: _depth,
          type: "folder",
          expandable: isSection ? false : hasChildren,
        });
        if (hasChildren && item.children) {
          if (isSection || expanded.includes(folderId)) {
            result.push(
              ...flattenVisibleTree(item.children, expanded, _depth + 1, _opts),
            );
          }
        }
      } else {
        result.push({
          id: item.path,
          name: item.name,
          path: item.path,
          level: _depth,
          type: "file",
          expandable: false,
        });
      }
    }
    return result;
  }

  function findFolder(tree: DocItem[], path: string): DocItem | null {
    for (const item of tree) {
      if (item.type === "folder" && item.path === path) return item;
      if (item.children) {
        const found = findFolder(item.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  return {
    docsModules,
    buildDocTree,
    flattenTree,
    flattenVisibleTree,
    findFolder,
    cleanLabel: (s: string) => s.replace(/^\d+-/, "").replace(/[-_]/g, " "),
    extractText: () => "",
    extractHeadings: () => [],
    slugify: (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    parseStatusMd: () => ({
      activeFocus: [],
      domains: [],
      migrations: [],
      summary: {},
    }),
    formatRelativeTime: () => "just now",
    isFavorite: () => false,
    getFavoriteFiles: () => [],
    getFavorites: () => [],
    toggleFavorite: () => {},
    getRecentFiles: () => [],
    loadDocContent: async (path: string) => {
      const map: Record<string, string> = {
        STATUS: "# STATUS\n\nDashboard content",
        "0-inbox/test-doc": "# Test Document\n\nTest content",
        "1-project/sample": "# Sample Project\n\nSample content",
      };
      return map[path] ?? "";
    },
  };
});

// ── Now safe to import app modules ──

import { createHeadlessPage } from "@os-devtool/testing/page";
import { DocsApp, selectDoc } from "@/docs-viewer/app";
import { DocsViewer } from "@/docs-viewer/DocsViewer";

describe("DocsViewer Headless", () => {
  it("T1: DocsViewer can be imported and page created", () => {
    const page = createHeadlessPage(DocsApp, DocsViewer);
    page.goto("/");

    // Basic sanity: page was created and HTML can be rendered
    const html = page.html();
    expect(html).toContain("data-zone");
  });

  it("T2: Tab cycle visits docs zones in order", () => {
    const page = createHeadlessPage(DocsApp, DocsViewer);
    page.goto("/");

    // Select a doc so docs-reader has items
    page.dispatch(selectDoc({ id: "STATUS" }));

    // Click on navbar button to bootstrap into a zone
    page.click("docs-btn-back");
    expect(page.activeZoneId()).toBe("docs-navbar");

    // Tab through zones — collect zone IDs we visit
    const visited: string[] = [page.activeZoneId()!];
    for (let i = 0; i < 15; i++) {
      page.keyboard.press("Tab");
      const zone = page.activeZoneId();
      if (zone && !visited.includes(zone)) {
        visited.push(zone);
      }
    }

    // DocsViewer should have these zones reachable via Tab
    expect(visited).toContain("docs-navbar");
    expect(visited).toContain("docs-reader");
    expect(visited.length).toBeGreaterThanOrEqual(2);
  });

  it("T2: docs-reader items reflect active document", () => {
    const page = createHeadlessPage(DocsApp, DocsViewer);
    page.goto("/");

    // Select STATUS doc
    page.dispatch(selectDoc({ id: "STATUS" }));

    // Navigate to docs-reader zone via Tab
    page.click("docs-btn-back");
    for (let i = 0; i < 15; i++) {
      if (page.activeZoneId() === "docs-reader") break;
      page.keyboard.press("Tab");
    }

    // docs-reader should be reachable and have a focused item
    expect(page.activeZoneId()).toBe("docs-reader");
    expect(page.focusedItemId()).toBeTruthy();
  });
});
