// Types for tree structure
export interface DocItem {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: DocItem[];
}

/** Strip date/time/type prefix and clean up display labels */
export function cleanLabel(label: string) {
  return label
    .replace(/^\d{4}-\d{4}-\d{4}-\[[a-z]+\]-/, "") // Strip YYYY-MMDD-HHmm-[type]- prefix
    .replace(/^\d{4}-\d{2}-\d{2}[_-](\d{4}[_-])?/, "") // Strip legacy YYYY-MM-DD_HHMM_ prefix
    .replace(/^0+(\d)/, "$1") // Strip zero-padding: 00 → 0, 01 → 1
    .replace(/[-_]/g, " ") // Replace dashes/underscores with spaces
    .replace(/\.md$/, "") // Remove .md extension
    .trim();
}

/** Build a file tree from a list of glob paths */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: tree building logic
export function buildDocTree(
  paths: string[],
  prefix = "../../docs/",
): DocItem[] {
  const root: DocItem[] = [];

  for (const filePath of paths) {
    const relativePath = filePath.replace(prefix, "").replace(".md", "");
    const parts = relativePath.split("/");

    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const existingItem = currentLevel.find((item) => item.name === part);

      if (existingItem) {
        if (!existingItem.children) existingItem.children = [];
        currentLevel = existingItem.children;
      } else {
        const newItem: DocItem = {
          name: part,
          path: isFile ? relativePath : parts.slice(0, index + 1).join("/"),
          type: isFile ? "file" : "folder",
          ...(isFile ? {} : { children: [] }),
        };
        currentLevel.push(newItem);
        if (!isFile && newItem.children) {
          currentLevel = newItem.children;
        }
      }
    });
  }

  const sortItems = (items: DocItem[], parentName?: string) => {
    const isInbox = parentName?.includes("inbox");
    items.sort((a, b) => {
      if (a.type === b.type) {
        return isInbox
          ? b.name.localeCompare(a.name, undefined, { numeric: true })
          : a.name.localeCompare(b.name, undefined, { numeric: true });
      }
      return a.type === "folder" ? -1 : 1;
    });
    for (const item of items) {
      if (item.children) sortItems(item.children, item.name);
    }
  };

  sortItems(root);
  return root;
}

/** Flatten tree into a list of files for prev/next navigation */
export function flattenTree(items: DocItem[]): DocItem[] {
  let flat: DocItem[] = [];
  for (const item of items) {
    if (item.type === "file") flat.push(item);
    if (item.children) flat = flat.concat(flattenTree(item.children));
  }
  return flat;
}

/** Recursively extract text content from React node trees */
export function extractText(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (
    typeof node === "object" &&
    "props" in node &&
    (node as { props: { children?: unknown } }).props?.children
  ) {
    return extractText(
      (node as { props: { children: unknown } }).props.children,
    );
  }
  return "";
}

/** Load all markdown files from the docs directory */
export const docsModules = import.meta.glob("../../docs/**/*.md", {
  query: "?raw",
  import: "default",
});

/** Load markdown content for a given doc path */
export async function loadDocContent(path: string): Promise<string> {
  const filePath = `../../docs/${path}.md`;
  const loader = docsModules[filePath];
  if (!loader) throw new Error("Document not found");
  return (await loader()) as string;
}

// --------------- Recent Files ---------------

export interface RecentDocItem extends DocItem {
  mtime: number;
}

/**
 * Returns the most recently modified files by joining the file list with mtime metadata.
 * @param allFiles  Flat list of all doc files
 * @param docsMeta  mtime map from virtual:docs-meta
 * @param limit     Max items to return (default: 7)
 */
export function getRecentFiles(
  allFiles: DocItem[],
  docsMeta: Record<string, { mtime: number }>,
  limit = 7,
): RecentDocItem[] {
  return allFiles
    .filter((f) => docsMeta[f.path] != null)
    .map((f) => ({ ...f, mtime: docsMeta[f.path].mtime }))
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit);
}

/**
 * Formats a timestamp into a human-readable relative time string.
 * e.g. "방금 전", "3분 전", "2시간 전", "어제", "3일 전"
 */
export function formatRelativeTime(mtime: number, now = Date.now()): string {
  const diff = now - mtime;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;

  return new Date(mtime).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

// --------------- Table of Contents ---------------

export interface TocHeading {
  depth: number; // 1-6
  text: string;
  slug: string;
}

/** Convert heading text to URL-friendly slug */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "") // keep alphanumeric, spaces, hyphens, Korean
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Extract headings (h1-h4) from raw markdown content.
 * Skips headings inside code blocks (``` ... ```).
 */
export function extractHeadings(content: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const lines = content.split("\n");
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      const depth = match[1].length;
      const text = match[2]
        .replace(/\*\*/g, "")   // strip bold
        .replace(/\*/g, "")     // strip italic
        .replace(/`/g, "")      // strip inline code
        .trim();
      headings.push({ depth, text, slug: slugify(text) });
    }
  }

  return headings;
}
