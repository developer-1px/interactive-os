/**
 * Collection Tree Showcase — Headless Input-First Tests
 *
 * Proves: createCollectionZone with nested tree data
 * = nested CRUD + clipboard + undo/redo via keyboard.
 *
 * @spec docs/1-project/os-core/collection-crud-showcase/notes/2026-0306-plan-collection-crud.md
 */

import { type AppPage, createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp";
import { createUndoRedoCommands } from "@os-sdk/app/defineApp/undoRedo";
import { history } from "@os-sdk/app/modules/history";
import {
  _resetClipboardStore,
  createCollectionZone,
} from "@os-sdk/library/collection/createCollectionZone";
import { beforeEach, describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Tree data — folders with nested files
// ═══════════════════════════════════════════════════════════════════

interface TreeItem {
  id: string;
  label: string;
  children?: TreeItem[];
}

interface TreeState {
  data: {
    items: TreeItem[];
  };
  history: { past: unknown[]; future: unknown[] };
}

const INITIAL: TreeState = {
  data: {
    items: [
      {
        id: "folder-a",
        label: "Components",
        children: [
          { id: "file-1", label: "Button.tsx" },
          { id: "file-2", label: "Dialog.tsx" },
        ],
      },
      {
        id: "folder-b",
        label: "Hooks",
        children: [{ id: "file-3", label: "useAuth.ts" }],
      },
      { id: "file-4", label: "index.ts" },
    ],
  },
  history: { past: [], future: [] },
};

// ═══════════════════════════════════════════════════════════════════
// App definition
// ═══════════════════════════════════════════════════════════════════

const TreeApp = defineApp<TreeState>("collection-tree-test", INITIAL, {
  modules: [history()],
});

const { undoCommand, redoCommand } = createUndoRedoCommands(TreeApp);

const treeCollection = createCollectionZone(TreeApp, "explorer", {
  accessor: (s: TreeState) => s.data.items,
  text: (item: TreeItem) => item.label,
});

const bindings = treeCollection.collectionBindings();

const TreeUI = treeCollection.bind({
  role: "tree",
  ...bindings,
  onUndo: undoCommand(),
  onRedo: redoCommand(),
  options: {
    select: { mode: "multiple", range: true, toggle: true, followFocus: false },
  },
});

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe("Collection Tree — Root-level CRUD via keyboard", () => {
  let page: AppPage<TreeState>;

  beforeEach(() => {
    _resetClipboardStore();
    page = createPage(TreeApp);
    page.goto("explorer", { focusedItemId: "folder-a" });
  });

  it("Delete removes root item", () => {
    // Focus on file-4 (root-level file)
    page.goto("explorer", { focusedItemId: "file-4" });
    page.keyboard.press("Delete");
    const ids = page.state.data.items.map((i) => i.id);
    expect(ids).not.toContain("file-4");
  });

  it("Meta+ArrowDown moves root item down", () => {
    page.keyboard.press("Meta+ArrowDown");
    expect(page.state.data.items[0]!.id).toBe("folder-b");
    expect(page.state.data.items[1]!.id).toBe("folder-a");
  });

  it("Meta+Z undoes root delete", () => {
    page.goto("explorer", { focusedItemId: "file-4" });
    page.keyboard.press("Delete");
    expect(page.state.data.items.map((i) => i.id)).not.toContain("file-4");

    page.keyboard.press("Meta+Z");
    expect(page.state.data.items.map((i) => i.id)).toContain("file-4");
  });
});

describe("Collection Tree — Nested CRUD via keyboard", () => {
  let page: AppPage<TreeState>;

  beforeEach(() => {
    _resetClipboardStore();
    page = createPage(TreeApp);
    // Focus on a nested file
    page.goto("explorer", { focusedItemId: "file-1" });
  });

  it("Delete removes nested item from parent's children", () => {
    page.keyboard.press("Delete");
    const folder = page.state.data.items.find((i) => i.id === "folder-a");
    const childIds = folder?.children?.map((c) => c.id) ?? [];
    expect(childIds).not.toContain("file-1");
    // file-2 should still be there
    expect(childIds).toContain("file-2");
  });

  it("Meta+Z undoes nested delete", () => {
    page.keyboard.press("Delete");
    page.keyboard.press("Meta+Z");
    const folder = page.state.data.items.find((i) => i.id === "folder-a");
    const childIds = folder?.children?.map((c) => c.id) ?? [];
    expect(childIds).toContain("file-1");
  });
});

describe("Collection Tree — Clipboard via keyboard", () => {
  let page: AppPage<TreeState>;

  beforeEach(() => {
    _resetClipboardStore();
    page = createPage(TreeApp);
    page.goto("explorer", { focusedItemId: "file-4" });
  });

  it("Meta+C copies root item, Meta+V pastes", () => {
    page.keyboard.press("Meta+C");
    page.keyboard.press("Meta+V");
    // Should have 4 root items now (3 original + 1 pasted)
    expect(page.state.data.items.length).toBe(4);
  });

  it("Meta+X cuts root item, Meta+V pastes elsewhere", () => {
    page.keyboard.press("Meta+X");
    expect(page.state.data.items.length).toBe(2); // cut removed 1

    page.goto("explorer", { focusedItemId: "folder-b" });
    page.keyboard.press("Meta+V");
    expect(page.state.data.items.length).toBe(3); // paste added 1
  });
});
