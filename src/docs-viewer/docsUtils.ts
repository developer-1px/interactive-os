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
// biome-ignore lint/suspicious/noExplicitAny: recursive React node text extraction
export function extractText(node: any): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node?.props?.children) return extractText(node.props.children);
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
