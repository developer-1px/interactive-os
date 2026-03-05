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

import { Keybindings } from "@os-core/2-resolve/keybindings";
import { defineApp } from "@os-sdk/app/defineApp";
import { produce } from "immer";
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
  searchOpen: boolean;
}

export const DocsApp = defineApp<DocsState>("docs-viewer", {
  activePath: getInitialPath(),
  searchOpen: false,
});

// ═══════════════════════════════════════════════════════════════════
// App-level Command — shared by all sidebar zones
// ═══════════════════════════════════════════════════════════════════

/** SELECT_DOC — sets activePath. Router middleware handles URL sync. */
export const selectDoc = DocsApp.command(
  "SELECT_DOC",
  (ctx, payload: { id: string }) => ({
    state: produce(ctx.state, (draft) => {
      draft.activePath = payload.id;
    }),
  }),
);

/** RESET_DOC — clears activePath. */
export const resetDoc = DocsApp.command("RESET_DOC", (ctx) => ({
  state: produce(ctx.state, (draft) => {
    draft.activePath = null;
  }),
}));

/** GO_BACK — router middleware delegates to TanStack Router history. */
export const goBack = DocsApp.command("GO_BACK", (ctx) => ({
  state: ctx.state,
}));

/** GO_FORWARD — router middleware delegates to TanStack Router history. */
export const goForward = DocsApp.command("GO_FORWARD", (ctx) => ({
  state: ctx.state,
}));

/** OPEN_SEARCH — opens the docs search overlay. */
export const openSearch = DocsApp.command("OPEN_SEARCH", (ctx) => ({
  state: produce(ctx.state, (draft) => {
    draft.searchOpen = true;
  }),
}));

/** CLOSE_SEARCH — closes the docs search overlay. */
export const closeSearch = DocsApp.command("CLOSE_SEARCH", (ctx) => ({
  state: produce(ctx.state, (draft) => {
    draft.searchOpen = false;
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
export const NEXT_SECTION = readerZone.command(
  "DOCS_NEXT_SECTION",
  () => undefined,
);

export const PREV_SECTION = readerZone.command(
  "DOCS_PREV_SECTION",
  () => undefined,
);

export const DocsReaderUI = readerZone.bind({
  role: "feed",
  keybindings: [
    { key: "Space", command: () => NEXT_SECTION() },
    { key: "Shift+Space", command: () => PREV_SECTION() },
  ],
});

// ═══════════════════════════════════════════════════════════════════
// App-level Keybindings — always active (not zone-scoped)
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "Alt+ArrowLeft", command: goBack() },
  { key: "Alt+ArrowRight", command: goForward() },
  { key: "/", command: openSearch(), when: "navigating" },
]);
