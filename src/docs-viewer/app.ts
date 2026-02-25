/**
 * DocsViewer App — defineApp for ZIFT primitives.
 *
 * Structure:
 *   DocsApp (defineApp)
 *     ├── State: activePath
 *     ├── Commands: selectDoc (app-level, shared by all zones)
 *     ├── Zones:
 *     │   ├── docs-favorites — pinned files (listbox)
 *     │   ├── docs-recent    — recent files (listbox)
 *     │   ├── docs-sidebar   — folder tree (tree)
 *     │   └── docs-reader    — section navigation (feed)
 */

import { produce } from "immer";
import { defineApp } from "@/os/defineApp";
import { buildDocTree, type DocItem, docsModules } from "./docsUtils";

// ═══════════════════════════════════════════════════════════════════
// Static Tree Data (build-time — computed once at module scope)
// ═══════════════════════════════════════════════════════════════════

const docTree = buildDocTree(Object.keys(docsModules));

/** Collect all folder IDs that have children (expandable). Static, tree-derived. */
function collectExpandableIds(items: DocItem[]): Set<string> {
  const set = new Set<string>();
  for (const item of items) {
    if (item.type === "folder" && item.children?.length) {
      set.add(`folder:${item.path}`);
      collectExpandableIds(item.children).forEach((id) => set.add(id));
    }
  }
  return set;
}

const expandableIds = collectExpandableIds(docTree);

// ═══════════════════════════════════════════════════════════════════
// URL Hash Utilities
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse a URL hash string and return the docs path, or null.
 *
 * Examples:
 *   "#/docs/inbox/readme.md" → "docs/inbox/readme.md"
 *   "#docs/inbox/readme.md"  → "docs/inbox/readme.md"
 *   ""                       → null
 *   "#"                      → null
 *   "#ext:folder/file.md"    → null  (external mode — handled separately)
 */
export function parseHashToPath(
  hash: string | null | undefined,
): string | null {
  if (!hash) return null;
  const stripped = hash.replace(/^#\/?/, "");
  if (!stripped || stripped.startsWith("ext:")) return null;
  return stripped;
}

/** Read initial activePath from window.location.hash (SSR-safe). */
function getInitialPath(): string | null {
  if (typeof window === "undefined") return null;
  return parseHashToPath(window.location.hash);
}

// ═══════════════════════════════════════════════════════════════════
// App State
// ═══════════════════════════════════════════════════════════════════

interface DocsState {
  activePath: string | null;
}

export const DocsApp = defineApp<DocsState>("docs-viewer", {
  activePath: getInitialPath(),
});

// ═══════════════════════════════════════════════════════════════════
// App-level Command — shared by all sidebar zones
// ═══════════════════════════════════════════════════════════════════

/** SELECT_DOC — sets activePath. Shared by Recent, Favorites, and Tree zones. */
export const selectDoc = DocsApp.command(
  "SELECT_DOC",
  (ctx, payload: { id: string }) => ({
    state: produce(ctx.state, (draft) => {
      draft.activePath = payload.id;
    }),
  }),
);

/** RESET_DOC — clears activePath (e.g. when switching folder source). */
export const resetDoc = DocsApp.command("RESET_DOC", (ctx) => ({
  state: produce(ctx.state, (draft) => {
    draft.activePath = null;
  }),
}));

// ═══════════════════════════════════════════════════════════════════
// Favorites Zone — pinned files
// ═══════════════════════════════════════════════════════════════════

const favoritesZone = DocsApp.createZone("docs-favorites");

export const DocsFavoritesUI = favoritesZone.bind({
  role: "listbox",
  onAction: (cursor) => selectDoc({ id: cursor.focusId }),
  onSelect: (cursor) => selectDoc({ id: cursor.focusId }),
  options: {
    select: { followFocus: true },
    activate: { onClick: true },
  },
});

// ═══════════════════════════════════════════════════════════════════
// Recent Zone — recently modified files
// ═══════════════════════════════════════════════════════════════════

const recentZone = DocsApp.createZone("docs-recent");

export const DocsRecentUI = recentZone.bind({
  role: "listbox",
  onAction: (cursor) => selectDoc({ id: cursor.focusId }),
  onSelect: (cursor) => selectDoc({ id: cursor.focusId }),
  options: {
    select: { followFocus: true },
    activate: { onClick: true },
  },
});

// ═══════════════════════════════════════════════════════════════════
// Sidebar Zone — tree navigation (existing)
// ═══════════════════════════════════════════════════════════════════

const sidebarZone = DocsApp.createZone("docs-sidebar");

export const DocsSidebarUI = sidebarZone.bind({
  role: "tree",
  onAction: (cursor) => selectDoc({ id: cursor.focusId }),
  onSelect: (cursor) => selectDoc({ id: cursor.focusId }),
  getExpandableItems: () => expandableIds,
});

// ═══════════════════════════════════════════════════════════════════
// Reader Zone — section-based content navigation
// ═══════════════════════════════════════════════════════════════════

const readerZone = DocsApp.createZone("docs-reader");

// Commands: stateless — no state change, scroll effect handled by component
export const NEXT_SECTION = readerZone.command("DOCS_NEXT_SECTION", () => undefined);

export const PREV_SECTION = readerZone.command("DOCS_PREV_SECTION", () => undefined);

export const DocsReaderUI = readerZone.bind({
  role: "feed",
  keybindings: [
    { key: "Space", command: () => NEXT_SECTION() },
    { key: "Shift+Space", command: () => PREV_SECTION() },
  ],
});
