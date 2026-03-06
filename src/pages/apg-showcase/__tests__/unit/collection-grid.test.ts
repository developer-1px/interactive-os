/**
 * Collection Grid Showcase — Headless Input-First Tests
 *
 * Proves: createCollectionZone with grid data (rows as items)
 * = row CRUD + clipboard + undo/redo via keyboard.
 *
 * Grid specifics: row = collection item, cell = field within row.
 * 2D navigation (ArrowLeft/Right for cells) is OS grid role behavior.
 * CRUD operates on rows via Delete, Meta+Arrow, Meta+C/X/V.
 *
 * @spec docs/1-project/os-core/collection-crud-showcase/notes/2026-0306-plan-collection-crud.md
 */

import { type AppPageInternal, createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp";
import { createUndoRedoCommands } from "@os-sdk/app/defineApp/undoRedo";
import { history } from "@os-sdk/app/modules/history";
import {
  _resetClipboardStore,
  createCollectionZone,
  fromEntities,
} from "@os-sdk/library/collection/createCollectionZone";
import { beforeEach, describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Grid data — rows with columns
// ═══════════════════════════════════════════════════════════════════

interface RowItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface GridState {
  data: {
    rows: Record<string, RowItem>;
    rowOrder: string[];
  };
  history: { past: unknown[]; future: unknown[] };
}

const INITIAL: GridState = {
  data: {
    rows: {
      r1: { id: "r1", name: "Alice", email: "alice@ex.com", role: "Admin" },
      r2: { id: "r2", name: "Bob", email: "bob@ex.com", role: "Editor" },
      r3: { id: "r3", name: "Carol", email: "carol@ex.com", role: "Viewer" },
    },
    rowOrder: ["r1", "r2", "r3"],
  },
  history: { past: [], future: [] },
};

// ═══════════════════════════════════════════════════════════════════
// App definition — row = collection item
// ═══════════════════════════════════════════════════════════════════

const GridApp = defineApp<GridState>("collection-grid-test", INITIAL, {
  modules: [history()],
});

const { undoCommand, redoCommand } = createUndoRedoCommands(GridApp);

const gridCollection = createCollectionZone(GridApp, "datagrid", {
  ...fromEntities(
    (s: GridState) => s.data.rows,
    (s: GridState) => s.data.rowOrder,
  ),
  text: (item: RowItem) => item.name,
});

const bindings = gridCollection.collectionBindings();

const _GridUI = gridCollection.bind({
  role: "grid",
  ...bindings,
  onUndo: undoCommand(),
  onRedo: redoCommand(),
  options: {
    navigate: { orientation: "both" },
    select: { mode: "multiple", range: true, followFocus: false },
  },
});

// ═══════════════════════════════════════════════════════════════════
// Tests — row-level CRUD via keyboard
// ═══════════════════════════════════════════════════════════════════

describe("Collection Grid — Row CRUD via keyboard", () => {
  let page: AppPageInternal<GridState>;

  beforeEach(() => {
    _resetClipboardStore();
    page = createPage(GridApp);
    page.goto("datagrid", { focusedItemId: "r1" });
  });

  it("Delete removes focused row", () => {
    page.keyboard.press("Delete");
    expect(page.state.data.rowOrder).not.toContain("r1");
    expect(page.state.data.rows["r1"]).toBeUndefined();
    expect(page.focusedItemId()).toBe("r2");
  });

  it("Meta+ArrowDown moves row down", () => {
    page.keyboard.press("Meta+ArrowDown");
    expect(page.state.data.rowOrder).toEqual(["r2", "r1", "r3"]);
  });

  it("Meta+ArrowUp on second row moves it up", () => {
    page.goto("datagrid", { focusedItemId: "r2" });
    page.keyboard.press("Meta+ArrowUp");
    expect(page.state.data.rowOrder).toEqual(["r2", "r1", "r3"]);
  });
});

describe("Collection Grid — Clipboard via keyboard", () => {
  let page: AppPageInternal<GridState>;

  beforeEach(() => {
    _resetClipboardStore();
    page = createPage(GridApp);
    page.goto("datagrid", { focusedItemId: "r1" });
  });

  it("Meta+C copies row, Meta+V pastes after focused row", () => {
    page.keyboard.press("Meta+C");
    page.goto("datagrid", { focusedItemId: "r3" });
    page.keyboard.press("Meta+V");
    expect(page.state.data.rowOrder.length).toBe(4);
  });

  it("Meta+X cuts row, Meta+V pastes elsewhere", () => {
    page.keyboard.press("Meta+X");
    expect(page.state.data.rowOrder).not.toContain("r1");

    page.goto("datagrid", { focusedItemId: "r3" });
    page.keyboard.press("Meta+V");
    expect(page.state.data.rowOrder.length).toBe(3);
  });
});

describe("Collection Grid — Undo/Redo via keyboard", () => {
  let page: AppPageInternal<GridState>;

  beforeEach(() => {
    _resetClipboardStore();
    page = createPage(GridApp);
    page.goto("datagrid", { focusedItemId: "r1" });
  });

  it("Meta+Z undoes row delete", () => {
    page.keyboard.press("Delete");
    expect(page.state.data.rowOrder).not.toContain("r1");

    page.keyboard.press("Meta+Z");
    expect(page.state.data.rowOrder).toContain("r1");
  });

  it("Meta+Shift+Z redoes after undo", () => {
    page.keyboard.press("Delete");
    page.keyboard.press("Meta+Z");
    page.keyboard.press("Meta+Shift+Z");
    expect(page.state.data.rowOrder).not.toContain("r1");
  });

  it("Meta+Z undoes reorder", () => {
    page.keyboard.press("Meta+ArrowDown");
    expect(page.state.data.rowOrder).toEqual(["r2", "r1", "r3"]);

    page.keyboard.press("Meta+Z");
    expect(page.state.data.rowOrder).toEqual(["r1", "r2", "r3"]);
  });
});
