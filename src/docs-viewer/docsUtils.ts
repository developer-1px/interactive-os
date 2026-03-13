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
    .replace(/^\d{4}-\d{4}-\d{4}-(\[[a-z]+\]-)?/, "") // Strip YYYY-MMDD-HHmm-[type]- prefix (tag optional)
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

/** Find a folder node by its path in the tree (recursive). Returns null if not found. */
export function findFolder(
  items: DocItem[],
  folderPath: string,
): DocItem | null {
  for (const item of items) {
    if (item.type === "folder" && item.path === folderPath) return item;
    if (item.children) {
      const found = findFolder(item.children, folderPath);
      if (found) return found;
    }
  }
  return null;
}

// --------------- Flat Tree (ARIA APG Tree View Pattern) ---------------

/** A single node in the flattened visible tree */
export interface FlatTreeNode {
  id: string;
  name: string;
  path: string;
  level: number;
  type: "folder" | "file";
  expandable: boolean;
}

export interface FlattenTreeOptions {
  /**
   * Folders at this level become section headers (always expanded, not OS items).
   * Set to -1 (default) for VS Code-style — all folders are expandable.
   * Set to 0 for docs-viewer style — top-level folders are section headers.
   */
  sectionLevel?: number;
}

/**
 * Transform nested DocItem[] → flat visible list.
 *
 * Pure function: tree data + OS expanded state → flat list.
 * Collapsed folders' children are excluded from the result.
 */
export function flattenVisibleTree(
  items: DocItem[],
  expandedItems: string[],
  level = 0,
  options: FlattenTreeOptions = {},
): FlatTreeNode[] {
  const sectionLevel = options.sectionLevel ?? -1;
  const result: FlatTreeNode[] = [];

  for (const item of items) {
    if (item.type === "folder") {
      const id = `folder:${item.path}`;
      const hasChildren = !!item.children?.length;
      const isSection = level === sectionLevel;

      result.push({
        id,
        name: item.name,
        path: item.path,
        level,
        type: "folder",
        expandable: isSection ? false : hasChildren,
      });

      // Section headers always show children; expandable folders respect OS state
      if (hasChildren && item.children) {
        if (isSection || expandedItems.includes(id)) {
          result.push(
            ...flattenVisibleTree(
              item.children,
              expandedItems,
              level + 1,
              options,
            ),
          );
        }
      }
    } else {
      result.push({
        id: item.path,
        name: item.name,
        path: item.path,
        level,
        type: "file",
        expandable: false,
      });
    }
  }

  return result;
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
  if (!allFiles) return [];
  return (
    allFiles
      .filter((f) => docsMeta[f.path] != null)
      // biome-ignore lint/style/noNonNullAssertion: filtered above — docsMeta[f.path] is guaranteed non-null
      .map((f) => ({ ...f, mtime: docsMeta[f.path]!.mtime }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, limit)
  );
}

// --------------- Agent Recent Files ---------------

export interface AgentRecentFile {
  /** Display name (filename without path) */
  name: string;
  /** Directory part of the relative path (e.g. "src/docs-viewer/") */
  dir: string;
  /** Relative path from project root */
  path: string;
  /** File extension (e.g. "ts", "md") */
  ext: string;
  /** Last tool used: "Read", "Edit", "Write", "Bash" */
  tool: string;
  /** ISO timestamp of last access */
  ts: string;
  /** Git commit message (first line) if available */
  commitMessage?: string;
  /** Session UUID */
  session?: string;
}

/** Check if a project file path is a Markdown file (.md extension) */
export function isProjectMarkdown(path: string): boolean {
  return path.endsWith(".md");
}

/**
 * Transform agent activity log entries into a recent files list.
 * Filters to file operations only, normalizes paths, deduplicates.
 */
export function getAgentRecentFiles(
  entries: Array<{
    ts: string;
    session: string;
    tool: string;
    detail: string;
    commitMessage?: string;
  }>,
  projectRoot: string,
  limit = 20,
): AgentRecentFile[] {
  const fileTools = new Set(["Read", "Edit", "Write"]);
  const result: AgentRecentFile[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (result.length >= limit) break;
    if (!fileTools.has(entry.tool)) continue;

    const detail = entry.detail;
    if (!detail || detail === "—") continue;

    // Normalize: absolute path → relative path from project root
    let relativePath = detail;
    if (detail.startsWith(projectRoot)) {
      relativePath = detail.slice(projectRoot.length);
      if (relativePath.startsWith("/")) relativePath = relativePath.slice(1);
    }

    // Skip if already seen (entries are newest-first, keep first occurrence)
    if (seen.has(relativePath)) continue;
    seen.add(relativePath);

    // Extract filename and extension
    const parts = relativePath.split("/");
    const filename = parts[parts.length - 1] ?? relativePath;
    const extMatch = filename.match(/\.(\w+)$/);
    const ext = extMatch ? extMatch[1]! : "";

    // Extract directory part
    const dir = parts.length > 1 ? `${parts.slice(0, -1).join("/")}/` : "";

    result.push({
      name: filename,
      dir,
      path: relativePath,
      ext,
      tool: entry.tool,
      ts: entry.ts,
      ...(entry.commitMessage !== undefined
        ? { commitMessage: entry.commitMessage }
        : {}),
      ...(entry.session !== undefined ? { session: entry.session } : {}),
    });
  }

  return result;
}

/** Activity entry input shape (from vite plugin) */
type ActivityEntry = {
  ts: string;
  session: string;
  tool: string;
  detail: string;
  commitMessage?: string;
};

/** A session group: latest read (active only) + writes, sorted newest first */
export interface SessionGroup {
  sessionId: string;
  latestRead: AgentRecentFile | null;
  writes: AgentRecentFile[];
  latestTs: string;
  isActive: boolean;
}

/**
 * Group all activity by session. Each session gets:
 * - `latestRead`: most recent Read file (only for active sessions)
 * - `writes`: Edit/Write files, newest first (deduped by path)
 * Sorted by latest activity timestamp, newest session first.
 */
export function getActivityBySession(
  entries: ActivityEntry[],
  projectRoot: string,
  activeThresholdMs = 2 * 60 * 1000,
): SessionGroup[] {
  const allFiles = getAgentRecentFiles(entries, projectRoot, 1000);

  // Collect reads and writes per session
  const sessionReads = new Map<string, AgentRecentFile>();
  const sessionWrites = new Map<string, AgentRecentFile[]>();

  for (const file of allFiles) {
    const session = file.session ?? "unknown";

    if (file.tool === "Read") {
      // Keep only the latest read per session (allFiles is newest-first)
      if (!sessionReads.has(session)) {
        sessionReads.set(session, file);
      }
    } else if (file.tool === "Edit" || file.tool === "Write") {
      const list = sessionWrites.get(session);
      if (list) {
        list.push(file);
      } else {
        sessionWrites.set(session, [file]);
      }
    }
  }

  // Merge all session IDs
  const allSessionIds = new Set([
    ...sessionReads.keys(),
    ...sessionWrites.keys(),
  ]);

  const now = Date.now();
  const result: SessionGroup[] = [];

  for (const sessionId of allSessionIds) {
    const writes = sessionWrites.get(sessionId) ?? [];
    const read = sessionReads.get(sessionId) ?? null;

    // Latest timestamp across all activity in this session
    let latestTs = "";
    if (read && read.ts > latestTs) latestTs = read.ts;
    for (const w of writes) {
      if (w.ts > latestTs) latestTs = w.ts;
    }
    if (!latestTs) continue;

    const elapsed = now - new Date(latestTs).getTime();
    const isActive = elapsed < activeThresholdMs;

    result.push({
      sessionId,
      latestRead: isActive ? read : null,
      writes,
      latestTs,
      isActive,
    });
  }

  // Only include sessions that have writes (read-only sessions are noise)
  const filtered = result.filter((g) => g.writes.length > 0);
  filtered.sort((a, b) => (a.latestTs > b.latestTs ? -1 : 1));
  return filtered;
}

// --------------- Favorites ---------------

const FAVORITES_KEY = "docs-viewer-favorites";

/** Get pinned doc paths from localStorage */
export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Toggle a doc path in favorites. Returns new favorites list. */
export function toggleFavorite(path: string): string[] {
  const favs = getFavorites();
  const idx = favs.indexOf(path);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(path);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return favs;
}

/** Check if a path is favorited */
export function isFavorite(path: string): boolean {
  return getFavorites().includes(path);
}

/** Get favorite DocItems from allFiles */
export function getFavoriteFiles(allFiles: DocItem[]): DocItem[] {
  if (!allFiles) return [];
  const favs = new Set(getFavorites());
  return allFiles.filter((f) => favs.has(f.path));
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

// --------------- STATUS.md Parser ---------------

export interface StatusActiveFocus {
  domain: string;
  project: string;
  description: string;
  weight: string;
}

export interface StatusProject {
  name: string;
  phase: string;
  lastActivity: string;
  isFocus: boolean;
}

export interface StatusDomain {
  name: string;
  description: string;
  projects: StatusProject[];
}

export interface StatusMigration {
  oldPattern: string;
  newPattern: string;
  remaining: string;
}

export interface StatusData {
  activeFocus: StatusActiveFocus[];
  domains: StatusDomain[];
  migrations: StatusMigration[];
  summary: Map<string, string>;
}

/** Parse STATUS.md markdown into structured data. */
export function parseStatusMd(content: string): StatusData {
  const activeFocus: StatusActiveFocus[] = [];
  const domains: StatusDomain[] = [];
  const migrations: StatusMigration[] = [];
  const summary = new Map<string, string>();

  const lines = content.split("\n");
  let section = "";
  let currentDomain: StatusDomain | null = null;
  let inTable = false;
  let tableHeaderPassed = false;

  for (const line of lines) {
    // Detect sections
    if (line.startsWith("## ") && line.includes("Active Focus")) {
      section = "focus";
      inTable = false;
      continue;
    }
    if (line.startsWith("## ") && line.includes("Domains")) {
      section = "domains";
      inTable = false;
      continue;
    }
    if (line.startsWith("## ") && line.includes("Active Migrations")) {
      section = "migrations";
      inTable = false;
      tableHeaderPassed = false;
      continue;
    }
    if (line.startsWith("## ") && line.includes("Summary")) {
      section = "summary";
      inTable = false;
      tableHeaderPassed = false;
      continue;
    }
    if (line.startsWith("## ")) {
      section = "";
      continue;
    }

    // Parse Active Focus
    if (section === "focus" && line.startsWith("**")) {
      const match = line.match(
        /^\*\*(\S+)\s*\/\s*(\S+)\*\*\s*—\s*(.+?)\.?\s*(Meta|Heavy|Light)?\s*\.?\s*$/,
      );
      if (match?.[1] && match[2] && match[3]) {
        activeFocus.push({
          domain: match[1],
          project: match[2],
          description: match[3].trim(),
          weight: match[4] ?? "",
        });
      }
    }

    // Parse Domains
    if (section === "domains") {
      if (line.startsWith("### ")) {
        const domainName = line.replace(/^###\s+/, "").trim();
        currentDomain = { name: domainName, description: "", projects: [] };
        domains.push(currentDomain);
        inTable = false;
        tableHeaderPassed = false;
        continue;
      }
      if (currentDomain && line.startsWith(">")) {
        currentDomain.description = line.replace(/^>\s*/, "").trim();
        continue;
      }
      if (currentDomain && line.startsWith("| Project")) {
        inTable = true;
        tableHeaderPassed = false;
        continue;
      }
      if (currentDomain && inTable && line.startsWith("|---")) {
        tableHeaderPassed = true;
        continue;
      }
      if (
        currentDomain &&
        inTable &&
        tableHeaderPassed &&
        line.startsWith("|")
      ) {
        const cells = line
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean);
        if (cells.length >= 3) {
          const rawName = cells[0]!;
          const isFocus = rawName.includes("🔥");
          const name = rawName.replace(/🔥\s*/, "").trim();
          currentDomain.projects.push({
            name,
            phase: cells[1]!,
            lastActivity: cells[2]!,
            isFocus,
          });
        }
        continue;
      }
      if (inTable && !line.startsWith("|")) {
        inTable = false;
        tableHeaderPassed = false;
      }
    }

    // Parse Migrations
    if (section === "migrations") {
      if (line.startsWith("| Old Pattern")) {
        inTable = true;
        tableHeaderPassed = false;
        continue;
      }
      if (inTable && line.startsWith("|---")) {
        tableHeaderPassed = true;
        continue;
      }
      if (inTable && tableHeaderPassed && line.startsWith("|")) {
        const cells = line
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean);
        if (cells.length >= 3) {
          migrations.push({
            oldPattern: cells[0]!,
            newPattern: cells[1]!,
            remaining: cells[2]!,
          });
        }
        continue;
      }
      if (inTable && !line.startsWith("|")) {
        inTable = false;
      }
    }

    // Parse Summary
    if (section === "summary") {
      if (line.startsWith("| Metric")) {
        inTable = true;
        tableHeaderPassed = false;
        continue;
      }
      if (inTable && line.startsWith("|---")) {
        tableHeaderPassed = true;
        continue;
      }
      if (inTable && tableHeaderPassed && line.startsWith("|")) {
        const cells = line
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean);
        if (cells.length >= 2) {
          summary.set(cells[0]!, cells[1]!);
        }
        continue;
      }
      if (inTable && !line.startsWith("|")) {
        inTable = false;
      }
    }
  }

  return { activeFocus, domains, migrations, summary };
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
    if (match?.[1] && match[2]) {
      const depth = match[1].length;
      const text = match[2]
        .replace(/\*\*/g, "") // strip bold
        .replace(/\*/g, "") // strip italic
        .replace(/`/g, "") // strip inline code
        .trim();
      headings.push({ depth, text, slug: slugify(text) });
    }
  }

  return headings;
}
