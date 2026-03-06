/**
 * Collection Listbox Showcase — Headless Input-First Tests
 *
 * Proves: createCollectionZone + collectionBindings + history()
 * = CRUD + clipboard + undo/redo working from keyboard input alone.
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
// Minimal normalized data — the ONLY thing an app author provides
// ═══════════════════════════════════════════════════════════════════

interface Item {
  id: string;
  label: string;
}

interface ListState {
  data: {
    items: Record<string, Item>;
    itemOrder: string[];
  };
  history: { past: unknown[]; future: unknown[] };
}

const INITIAL: ListState = {
  data: {
    items: {
      a: { id: "a", label: "Apple" },
      b: { id: "b", label: "Banana" },
      c: { id: "c", label: "Cherry" },
    },
    itemOrder: ["a", "b", "c"],
  },
  history: { past: [], future: [] },
};

// ═══════════════════════════════════════════════════════════════════
// App definition — this is ALL the app author writes
// ═══════════════════════════════════════════════════════════════════

const ListApp = defineApp<ListState>("collection-listbox-test", INITIAL, {
  modules: [history()],
});

const { undoCommand, redoCommand } = createUndoRedoCommands(ListApp);

const listCollection = createCollectionZone(ListApp, "fruits", {
  ...(() => {
    // fromEntities inline — normalized Record + order array
    const getEntities = (s: ListState) => s.data.items;
    const getOrder = (s: ListState) => s.data.itemOrder;
    return {
      _ops: {
        getItems: (s: ListState): Item[] =>
          getOrder(s)
            .map((id) => getEntities(s)[id])
            .filter((t): t is Item => !!t),
        insertAfter: (draft: ListState, index: number, item: Item) => {
          draft.data.items[item.id] = item;
          draft.data.itemOrder.splice(index + 1, 0, item.id);
        },
        removeItem: (draft: ListState, id: string) => {
          delete draft.data.items[id];
          const idx = draft.data.itemOrder.indexOf(id);
          if (idx !== -1) draft.data.itemOrder.splice(idx, 1);
        },
        swapItems: (draft: ListState, id1: string, id2: string) => {
          const order = draft.data.itemOrder;
          const i1 = order.indexOf(id1);
          const i2 = order.indexOf(id2);
          if (i1 !== -1 && i2 !== -1) {
            [order[i1], order[i2]] = [order[i2]!, order[i1]!];
          }
        },
      },
    };
  })(),
  text: (item: Item) => item.label,
  create: (payload) => {
    const { label } = payload as { label: string };
    if (!label?.trim()) return null;
    return { id: Math.random().toString(36).slice(2, 8), label: label.trim() };
  },
});

const bindings = listCollection.collectionBindings();

const ListUI = listCollection.bind({
  role: "listbox",
  ...bindings,
  onUndo: undoCommand(),
  onRedo: redoCommand(),
  options: {
    select: { mode: "multiple", range: true, toggle: true, followFocus: false },
  },
});

// ═══════════════════════════════════════════════════════════════════
// Tests — keyboard input only
// ═══════════════════════════════════════════════════════════════════

describe("Collection Listbox — CRUD via keyboard", () => {
  let page: AppPage<ListState>;

  beforeEach(() => {
    _resetClipboardStore();
    page = createPage(ListApp);
    page.goto("fruits", { focusedItemId: "a" });
  });

  // ── Navigation ──

  it("ArrowDown moves focus to next item", () => {
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("b");
  });

  it("ArrowUp moves focus to previous item", () => {
    page.goto("fruits", { focusedItemId: "b" });
    page.keyboard.press("ArrowUp");
    expect(page.focusedItemId()).toBe("a");
  });

  // ── Delete ──

  it("Delete removes focused item and recovers focus", () => {
    page.keyboard.press("Delete");
    const state = page.state;
    expect(state.data.itemOrder).not.toContain("a");
    expect(state.data.items["a"]).toBeUndefined();
    // Focus should recover to next item
    expect(page.focusedItemId()).toBe("b");
  });

  // ── Move (reorder) ──

  it("Meta+ArrowDown moves focused item down", () => {
    page.keyboard.press("Meta+ArrowDown");
    expect(page.state.data.itemOrder).toEqual(["b", "a", "c"]);
  });

  it("Meta+ArrowUp on second item moves it up", () => {
    page.goto("fruits", { focusedItemId: "b" });
    page.keyboard.press("Meta+ArrowUp");
    expect(page.state.data.itemOrder).toEqual(["b", "a", "c"]);
  });
});

describe("Collection Listbox — Clipboard via keyboard", () => {
  let page: AppPage<ListState>;

  beforeEach(() => {
    _resetClipboardStore();
    page = createPage(ListApp);
    page.goto("fruits", { focusedItemId: "a" });
  });

  // ── Copy + Paste ──

  it("Meta+C copies, Meta+V pastes after focused item", () => {
    // Copy "Apple"
    page.keyboard.press("Meta+C");

    // Move to "c" and paste
    page.goto("fruits", { focusedItemId: "c" });
    page.keyboard.press("Meta+V");

    // Should have 4 items, new item after "c"
    expect(page.state.data.itemOrder.length).toBe(4);
    // Original "a" should still exist
    expect(page.state.data.items["a"]).toBeDefined();
  });

  // ── Cut + Paste ──

  it("Meta+X cuts item, Meta+V pastes it elsewhere", () => {
    // Cut "Apple"
    page.keyboard.press("Meta+X");
    expect(page.state.data.itemOrder).not.toContain("a");

    // Paste after "c" (focus should have recovered to "b")
    page.goto("fruits", { focusedItemId: "c" });
    page.keyboard.press("Meta+V");

    // Should have 3 items (cut removed 1, paste added 1)
    expect(page.state.data.itemOrder.length).toBe(3);
  });
});

describe("Collection Listbox — Undo/Redo via keyboard", () => {
  let page: AppPage<ListState>;

  beforeEach(() => {
    _resetClipboardStore();
    page = createPage(ListApp);
    page.goto("fruits", { focusedItemId: "a" });
  });

  it("Meta+Z undoes delete", () => {
    page.keyboard.press("Delete");
    expect(page.state.data.itemOrder).not.toContain("a");

    page.keyboard.press("Meta+Z");
    expect(page.state.data.itemOrder).toContain("a");
    expect(page.state.data.items["a"]).toBeDefined();
  });

  it("Meta+Shift+Z redoes after undo", () => {
    page.keyboard.press("Delete");
    page.keyboard.press("Meta+Z"); // undo
    expect(page.state.data.itemOrder).toContain("a");

    page.keyboard.press("Meta+Shift+Z"); // redo
    expect(page.state.data.itemOrder).not.toContain("a");
  });

  it("Meta+Z undoes reorder", () => {
    page.keyboard.press("Meta+ArrowDown"); // a moves to index 1
    expect(page.state.data.itemOrder).toEqual(["b", "a", "c"]);

    page.keyboard.press("Meta+Z");
    expect(page.state.data.itemOrder).toEqual(["a", "b", "c"]);
  });
});
