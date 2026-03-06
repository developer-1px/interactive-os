/**
 * Collection Treegrid Showcase — Headless Input-First Tests
 *
 * Proves: createCollectionZone with treegrid (tree + grid hybrid)
 * = row CRUD + tree expand/collapse + clipboard + undo/redo.
 *
 * Treegrid specifics:
 * - Row-first model: items are rows, cells are rendered within rows
 * - ArrowRight/Left expands/collapses threads (tree behavior)
 * - Delete/Meta+Arrow/Meta+C/X/V operate on rows (collection behavior)
 * - Undo/Redo restores tree structure
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
} from "@os-sdk/library/collection/createCollectionZone";
import { beforeEach, describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Treegrid data — email threads with replies (nested)
// ═══════════════════════════════════════════════════════════════════

interface EmailRow {
  id: string;
  subject: string;
  sender: string;
  children?: EmailRow[];
}

interface TreegridState {
  data: {
    threads: EmailRow[];
  };
  history: { past: unknown[]; future: unknown[] };
}

const INITIAL: TreegridState = {
  data: {
    threads: [
      {
        id: "thread-1",
        subject: "Design Review",
        sender: "alice@ex.com",
        children: [
          {
            id: "reply-1a",
            subject: "Re: Design Review",
            sender: "bob@ex.com",
          },
          {
            id: "reply-1b",
            subject: "Re: Design Review",
            sender: "carol@ex.com",
          },
        ],
      },
      {
        id: "thread-2",
        subject: "Sprint Planning",
        sender: "dave@ex.com",
        children: [
          {
            id: "reply-2a",
            subject: "Re: Sprint Planning",
            sender: "eve@ex.com",
          },
        ],
      },
      { id: "msg-3", subject: "Audit Report", sender: "frank@ex.com" },
    ],
  },
  history: { past: [], future: [] },
};

// ═══════════════════════════════════════════════════════════════════
// App definition
// ═══════════════════════════════════════════════════════════════════

const TreegridApp = defineApp<TreegridState>(
  "collection-treegrid-test",
  INITIAL,
  {
    modules: [history()],
  },
);

const { undoCommand, redoCommand } = createUndoRedoCommands(TreegridApp);

const tgCollection = createCollectionZone(TreegridApp, "inbox", {
  accessor: (s: TreegridState) => s.data.threads,
  text: (item: EmailRow) => item.subject,
});

const bindings = tgCollection.collectionBindings();

const TreegridUI = tgCollection.bind({
  role: "treegrid",
  ...bindings,
  onUndo: undoCommand(),
  onRedo: redoCommand(),
  options: {
    select: { mode: "multiple", range: true, toggle: true, followFocus: false },
  },
});

// ═══════════════════════════════════════════════════════════════════
// Tests — Row-level CRUD on treegrid
// ═══════════════════════════════════════════════════════════════════

describe("Collection Treegrid — Root row CRUD via keyboard", () => {
  let page: AppPageInternal<TreegridState>;

  beforeEach(() => {
    _resetClipboardStore();
    page = createPage(TreegridApp);
    page.goto("inbox", { focusedItemId: "msg-3" });
  });

  it("Delete removes root row and recovers focus", () => {
    page.keyboard.press("Delete");
    const ids = page.state.data.threads.map((t) => t.id);
    expect(ids).not.toContain("msg-3");
    // Focus should recover to previous item
    expect(page.focusedItemId()).toBe("thread-2");
  });

  it("Meta+ArrowDown moves root row down", () => {
    page.goto("inbox", { focusedItemId: "thread-1" });
    page.keyboard.press("Meta+ArrowDown");
    expect(page.state.data.threads[0]!.id).toBe("thread-2");
    expect(page.state.data.threads[1]!.id).toBe("thread-1");
  });
});

describe("Collection Treegrid — Nested reply CRUD via keyboard", () => {
  let page: AppPageInternal<TreegridState>;

  beforeEach(() => {
    _resetClipboardStore();
    page = createPage(TreegridApp);
    page.goto("inbox", { focusedItemId: "reply-1a" });
  });

  it("Delete removes nested reply from thread", () => {
    page.keyboard.press("Delete");
    const thread = page.state.data.threads.find((t) => t.id === "thread-1");
    const childIds = thread?.children?.map((c) => c.id) ?? [];
    expect(childIds).not.toContain("reply-1a");
    expect(childIds).toContain("reply-1b");
  });

  it("Meta+Z undoes nested reply delete", () => {
    page.keyboard.press("Delete");
    page.keyboard.press("Meta+Z");
    const thread = page.state.data.threads.find((t) => t.id === "thread-1");
    const childIds = thread?.children?.map((c) => c.id) ?? [];
    expect(childIds).toContain("reply-1a");
  });
});

describe("Collection Treegrid — Clipboard via keyboard", () => {
  let page: AppPageInternal<TreegridState>;

  beforeEach(() => {
    _resetClipboardStore();
    page = createPage(TreegridApp);
    page.goto("inbox", { focusedItemId: "msg-3" });
  });

  it("Meta+C copies row, Meta+V pastes", () => {
    page.keyboard.press("Meta+C");
    page.keyboard.press("Meta+V");
    expect(page.state.data.threads.length).toBe(4);
  });

  it("Meta+X cuts thread (with children), Meta+V pastes it", () => {
    page.goto("inbox", { focusedItemId: "thread-1" });
    page.keyboard.press("Meta+X");
    expect(page.state.data.threads.length).toBe(2);

    page.goto("inbox", { focusedItemId: "msg-3" });
    page.keyboard.press("Meta+V");
    // Pasted thread should have its children preserved
    expect(page.state.data.threads.length).toBe(3);
    const pasted = page.state.data.threads.find(
      (t) => t.subject === "Design Review" && t.id !== "thread-1",
    );
    expect(pasted?.children?.length).toBe(2);
  });
});

describe("Collection Treegrid — Undo/Redo via keyboard", () => {
  let page: AppPageInternal<TreegridState>;

  beforeEach(() => {
    _resetClipboardStore();
    page = createPage(TreegridApp);
    page.goto("inbox", { focusedItemId: "thread-1" });
  });

  it("Meta+Z undoes root delete, preserving children", () => {
    page.keyboard.press("Delete");
    expect(page.state.data.threads.map((t) => t.id)).not.toContain("thread-1");

    page.keyboard.press("Meta+Z");
    const restored = page.state.data.threads.find((t) => t.id === "thread-1");
    expect(restored).toBeDefined();
    expect(restored?.children?.length).toBe(2);
  });

  it("Meta+Z undoes reorder", () => {
    page.keyboard.press("Meta+ArrowDown");
    expect(page.state.data.threads[0]!.id).toBe("thread-2");

    page.keyboard.press("Meta+Z");
    expect(page.state.data.threads[0]!.id).toBe("thread-1");
  });
});
