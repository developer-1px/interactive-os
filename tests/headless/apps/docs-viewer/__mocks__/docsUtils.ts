/**
 * Shared mock for @/docs-viewer/docsUtils.
 *
 * Replaces import.meta.glob-based docsModules with 3 fake file entries.
 * Used by docs-scenarios.test.ts and docs-viewer-headless.test.ts.
 */

// Fake file entries — enough variety for sidebar/recent/favorites tests
export const docsModules: Record<string, () => Promise<string>> = {
  "../../docs/STATUS.md": () => Promise.resolve("# STATUS"),
  "../../docs/0-inbox/test-doc.md": () => Promise.resolve("# Test Document"),
  "../../docs/0-inbox/second-doc.md": () => Promise.resolve("# Second"),
  "../../docs/1-project/sample.md": () => Promise.resolve("# Sample Project"),
  "../../docs/1-project/design.md": () => Promise.resolve("# Design"),
  "../../docs/1-project/roadmap.md": () => Promise.resolve("# Roadmap"),
  "../../docs/2-area/notes.md": () => Promise.resolve("# Notes"),
  "../../docs/2-area/patterns.md": () => Promise.resolve("# Patterns"),
};

interface DocItem {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: DocItem[];
}

export function buildDocTree(keys: string[]): DocItem[] {
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

export function flattenTree(tree: DocItem[]): DocItem[] {
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

export function flattenVisibleTree(
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

export function findFolder(tree: DocItem[], path: string): DocItem | null {
  for (const item of tree) {
    if (item.type === "folder" && item.path === path) return item;
    if (item.children) {
      const found = findFolder(item.children, path);
      if (found) return found;
    }
  }
  return null;
}

export const cleanLabel = (s: string) =>
  s.replace(/^\d+-/, "").replace(/[-_]/g, " ");
export const extractText = () => "";
export const extractHeadings = () => [];
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
export const parseStatusMd = () => ({
  activeFocus: [],
  domains: [],
  migrations: [],
  summary: {},
});
export const formatRelativeTime = () => "just now";
// Precomputed file list for getRecentFiles/getFavoriteFiles
const _allFiles = flattenTree(buildDocTree(Object.keys(docsModules)));

export const isFavorite = (path: string) =>
  _allFiles.slice(0, 2).some((f) => f.path === path);
export const getFavoriteFiles = (allFiles?: { path: string }[]) => {
  const files = allFiles ?? _allFiles;
  return files.slice(0, 2);
};
export const getFavorites = () => _allFiles.slice(0, 2).map((f) => f.path);
export const toggleFavorite = () => {};
export const getRecentFiles = (
  allFiles?: { path: string; name: string; type: string }[],
  _docsMeta?: Record<string, { mtime: number }>,
  _limit = 7,
) => {
  const files = allFiles ?? _allFiles;
  return files.map((f, i) => ({ ...f, mtime: Date.now() - i * 1000 }));
};
export const loadDocContent = async (path: string) => {
  const map: Record<string, string> = {
    STATUS: "# STATUS\n\nDashboard content",
    "0-inbox/test-doc": "# Test Document\n\nTest content",
    "0-inbox/second-doc": "# Second\n\nSecond content",
    "1-project/sample": "# Sample Project\n\nSample content",
    "1-project/design": "# Design\n\nDesign content",
    "1-project/roadmap": "# Roadmap\n\nRoadmap content",
    "2-area/notes": "# Notes\n\nNotes content",
    "2-area/patterns": "# Patterns\n\nPatterns content",
  };
  return map[path] ?? "";
};
