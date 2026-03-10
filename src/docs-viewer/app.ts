/**
 * DocsViewer App — defineApp for ZIFT primitives.
 *
 * Structure:
 *   DocsApp (defineApp)
 *     ├── State: activePath, favVersion
 *     ├── Commands: selectDoc, goBack, goForward, openSearch, toggleFav
 *     ├── Overlays: docs-search (dialog)
 *     ├── Zones:
 *     │   ├── docs-navbar    — navigation toolbar (toolbar)
 *     │   ├── docs-favorites — pinned files (listbox)
 *     │   ├── docs-recent    — recent files (listbox)
 *     │   ├── docs-sidebar   — folder tree (tree)
 *     │   └── docs-reader    — content + navigation (feed)
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { OS_ACTIVATE, OS_OVERLAY_OPEN, os } from "@os-sdk/os";
import { zoneItemId } from "@os-sdk/zoneItemId";
import { produce } from "immer";
import {
  buildDocTree,
  type DocItem,
  docsModules,
  findFolder,
  flattenTree,
  flattenVisibleTree,
  getFavoriteFiles,
  toggleFavorite,
} from "./docsUtils";

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

/** All leaf files in the doc tree (static). Used by favorites getItems. */
const allFiles = flattenTree(docTree);

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

export interface DocsState {
  activePath: string | null;
  favVersion: number;
}

export const DocsApp = defineApp<DocsState>("docs-viewer", {
  activePath: getInitialPath(),
  favVersion: 0,
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
export const goBack = DocsApp.command(
  "GO_BACK",
  (ctx) => ({
    state: ctx.state,
  }),
  { key: "Alt+ArrowLeft" },
);

/** GO_FORWARD — router middleware delegates to TanStack Router history. */
export const goForward = DocsApp.command(
  "GO_FORWARD",
  (ctx) => ({
    state: ctx.state,
  }),
  { key: "Alt+ArrowRight" },
);

/** OPEN_SEARCH — opens the docs search overlay via OS overlay system. */
export const openSearch = DocsApp.command(
  "OPEN_SEARCH",
  (ctx) => ({
    state: ctx.state,
    dispatch: [OS_OVERLAY_OPEN({ id: "docs-search", type: "dialog" })],
  }),
  { key: "/", when: "navigating" },
);

/** TOGGLE_FAVORITE — toggles pin for activePath, bumps favVersion for re-render. */
export const toggleFav = DocsApp.command("TOGGLE_FAVORITE", (ctx) => {
  if (ctx.state.activePath) {
    toggleFavorite(ctx.state.activePath);
  }
  return {
    state: produce(ctx.state, (draft) => {
      draft.favVersion += 1;
    }),
  };
});

// ═══════════════════════════════════════════════════════════════════
// Navbar Zone — navigation toolbar (back, forward, breadcrumb, search)
// ═══════════════════════════════════════════════════════════════════

const navbarZone = DocsApp.createZone("docs-navbar");

/** Search overlay — dialog role, triggered from navbar */
export const searchOverlay = navbarZone.overlay("docs-search", {
  role: "dialog",
});

export const DocsNavbarUI = navbarZone.bind({
  role: "toolbar",
  onAction: (cursor) => {
    switch (cursor.focusId) {
      case "docs-btn-back":
        return goBack();
      case "docs-btn-forward":
        return goForward();
      case "docs-btn-search":
        return openSearch();
      case "docs-toggle-pin":
        return toggleFav();
      default:
        // Breadcrumb segments: "bc:{segmentPath}"
        if (cursor.focusId.startsWith("bc:"))
          return selectDoc({ id: `folder:${cursor.focusId.slice(3)}` });
        // Navigation targets (return home, etc.)
        return selectDoc({ id: cursor.focusId });
    }
  },
  options: {
    navigate: { orientation: "horizontal" },
    inputmap: { click: [OS_ACTIVATE()] },
  },
});

// ═══════════════════════════════════════════════════════════════════
// Favorites Zone — pinned files
// ═══════════════════════════════════════════════════════════════════

const favoritesZone = DocsApp.createZone("docs-favorites");

export const DocsFavoritesUI = favoritesZone.bind({
  role: "listbox",
  onAction: (cursor) => selectDoc({ id: cursor.focusId }),
  onSelect: (cursor) => selectDoc({ id: cursor.focusId }),
  getItems: () => getFavoriteFiles(allFiles).map((f) => f.path),
  options: {
    select: { followFocus: true },
    inputmap: { click: [OS_ACTIVATE()] },
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
    inputmap: { click: [OS_ACTIVATE()] },
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
  getItems: () => {
    const zoneItems = os.getState().os.focus.zones["docs-sidebar"]?.items ?? {};
    const expanded = Object.keys(zoneItems).filter(
      (id) => zoneItems[id]?.["aria-expanded"],
    );
    const nodes = flattenVisibleTree(docTree, expanded, 0, {
      sectionLevel: 0,
    });
    // Section headers (level 0 folders) are not interactive OS items
    return nodes
      .filter((n) => !(n.type === "folder" && n.level === 0))
      .map((n) => n.id);
  },
});

// ═══════════════════════════════════════════════════════════════════
// Reader Zone — section-based content navigation
// ═══════════════════════════════════════════════════════════════════

const readerZone = DocsApp.createZone("docs-reader");

// Commands: stateless — no state change, scroll effect handled by component
export const NEXT_SECTION = readerZone.command(
  "DOCS_NEXT_SECTION",
  () => undefined,
  { key: "Space" },
);

export const PREV_SECTION = readerZone.command(
  "DOCS_PREV_SECTION",
  () => undefined,
  { key: "Shift+Space" },
);

export const DocsReaderUI = readerZone.bind({
  role: "feed",
  onAction: (cursor) => selectDoc({ id: cursor.focusId }),
  getItems: () => {
    const rid = (id: string) => zoneItemId("docs-reader", id);
    const appState = os.getState().apps["docs-viewer"] as DocsState | undefined;
    const activePath = appState?.activePath;

    // Folder view → children IDs
    if (activePath?.startsWith("folder:")) {
      const folderPath = activePath.slice("folder:".length);
      const folder = findFolder(docTree, folderPath);
      return (folder?.children ?? []).map((c) =>
        rid(c.type === "folder" ? `folder:${c.path}` : c.path),
      );
    }

    // File view → single article
    if (activePath) return [rid(activePath)];

    // No active path → root folder index (initial state)
    return docTree.map((c) =>
      rid(c.type === "folder" ? `folder:${c.path}` : c.path),
    );
  },
  options: {
    inputmap: { click: [OS_ACTIVATE()] },
  },
  triggers: {
    SelectDoc: (fid: string) => selectDoc({ id: fid }),
    PrevDoc: (fid: string) => selectDoc({ id: fid }),
    NextDoc: (fid: string) => selectDoc({ id: fid }),
  },
});
