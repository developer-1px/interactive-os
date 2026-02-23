/**
 * createCollectionZone — Unit tests
 *
 * Tests two data shapes:
 *   - Array (Builder): accessor-based
 *   - Entity+Order (Todo): fromEntities-based
 * Both share the same CRUD API.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  _resetClipboardStore,
  createCollectionZone,
  fromEntities,
  readClipboard,
} from "@/os/collection/createCollectionZone";
import { defineApp } from "@/os/defineApp";

// ═══════════════════════════════════════════════════════════════════
// Fixture A: Array-based (Builder)
// ═══════════════════════════════════════════════════════════════════

interface SectionEntry {
  id: string;
  label: string;
  type: "hero" | "news" | "services" | "footer";
}

interface ArrayState {
  data: { sections: SectionEntry[] };
  history: { past: any[]; future: any[] };
}

const ARRAY_INITIAL: ArrayState = {
  data: {
    sections: [
      { id: "hero", label: "Hero", type: "hero" },
      { id: "news", label: "News", type: "news" },
      { id: "services", label: "Services", type: "services" },
      { id: "footer", label: "Footer", type: "footer" },
    ],
  },
  history: { past: [], future: [] },
};

const ArrayApp = defineApp<ArrayState>("test-array-v2", ARRAY_INITIAL);

const arraySidebar = createCollectionZone(ArrayApp, "sidebar-v2", {
  accessor: (s: ArrayState) => s.data.sections,
});

// ═══════════════════════════════════════════════════════════════════
// Fixture B: Entity+Order (Todo)
// ═══════════════════════════════════════════════════════════════════

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  categoryId: string;
}

interface EntityState {
  data: {
    todos: Record<string, Todo>;
    todoOrder: string[];
  };
  ui: {
    selectedCategoryId: string;
  };
  history: { past: any[]; future: any[] };
}

const ENTITY_INITIAL: EntityState = {
  data: {
    todos: {
      a: { id: "a", text: "Buy milk", completed: false, categoryId: "work" },
      b: {
        id: "b",
        text: "Write tests",
        completed: true,
        categoryId: "personal",
      },
      c: { id: "c", text: "Ship it", completed: false, categoryId: "work" },
      d: {
        id: "d",
        text: "Read book",
        completed: false,
        categoryId: "personal",
      },
    },
    todoOrder: ["a", "b", "c", "d"],
  },
  ui: { selectedCategoryId: "work" },
  history: { past: [], future: [] },
};

const EntityApp = defineApp<EntityState>("test-entity-v2", ENTITY_INITIAL);

// Without filter — basic entity+order
const entityList = createCollectionZone(EntityApp, "list-v2", {
  ...fromEntities(
    (s: EntityState) => s.data.todos,
    (s: EntityState) => s.data.todoOrder,
  ),
});

// With filter — category-filtered (like real Todo app)
const filteredList = createCollectionZone(EntityApp, "filtered-v2", {
  ...fromEntities(
    (s: EntityState) => s.data.todos,
    (s: EntityState) => s.data.todoOrder,
  ),
  filter: (state: EntityState) => (item: Todo) =>
    item.categoryId === state.ui.selectedCategoryId,
});

// With clipboard — full Todo pattern (v2: text + onPaste, no ClipboardConfig)
const clipboardList = createCollectionZone(EntityApp, "clip-v2", {
  ...fromEntities(
    (s: EntityState) => s.data.todos,
    (s: EntityState) => s.data.todoOrder,
  ),
  text: (item: Todo) => item.text,
  onPaste: (item: Todo, state: EntityState) => ({
    ...item,
    categoryId: state.ui.selectedCategoryId,
  }),
});

// ═══════════════════════════════════════════════════════════════════
// Tests: Array-based (Builder pattern)
// ═══════════════════════════════════════════════════════════════════

describe("createCollectionZone — Array (Builder)", () => {
  let app: ReturnType<typeof ArrayApp.create>;

  beforeEach(() => {
    app = ArrayApp.create({ withOS: true });
  });

  function ids(): string[] {
    return app.state.data.sections.map((s) => s.id);
  }

  describe("remove", () => {
    it("removes item by id", () => {
      app.dispatch(arraySidebar.remove({ id: "news" }));
      expect(ids()).toEqual(["hero", "services", "footer"]);
    });

    it("is no-op for unknown id", () => {
      const before = app.state.data.sections;
      app.dispatch(arraySidebar.remove({ id: "nonexistent" }));
      expect(app.state.data.sections).toEqual(before);
    });
  });

  describe("moveUp", () => {
    it("swaps item with previous sibling", () => {
      app.dispatch(arraySidebar.moveUp({ id: "news" }));
      expect(ids()).toEqual(["news", "hero", "services", "footer"]);
    });

    it("is no-op when already first", () => {
      app.dispatch(arraySidebar.moveUp({ id: "hero" }));
      expect(ids()).toEqual(["hero", "news", "services", "footer"]);
    });
  });

  describe("moveDown", () => {
    it("swaps item with next sibling", () => {
      app.dispatch(arraySidebar.moveDown({ id: "news" }));
      expect(ids()).toEqual(["hero", "services", "news", "footer"]);
    });

    it("is no-op when already last", () => {
      app.dispatch(arraySidebar.moveDown({ id: "footer" }));
      expect(ids()).toEqual(["hero", "news", "services", "footer"]);
    });
  });

  describe("duplicate", () => {
    it("inserts copy after original", () => {
      app.dispatch(arraySidebar.duplicate({ id: "hero" }));
      expect(app.state.data.sections).toHaveLength(5);
      expect(app.state.data.sections[0]!.id).toBe("hero");
      expect(app.state.data.sections[1]!.type).toBe("hero");
      expect(app.state.data.sections[1]!.id).not.toBe("hero");
    });

    it("is no-op for unknown id", () => {
      app.dispatch(arraySidebar.duplicate({ id: "nonexistent" }));
      expect(app.state.data.sections).toHaveLength(4);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// Tests: Entity+Order (Todo pattern)
// ═══════════════════════════════════════════════════════════════════

describe("createCollectionZone — Entity+Order (Todo)", () => {
  let app: ReturnType<typeof EntityApp.create>;

  beforeEach(() => {
    app = EntityApp.create({ withOS: true });
  });

  function order(): string[] {
    return app.state.data.todoOrder;
  }

  function entity(id: string): Todo | undefined {
    return app.state.data.todos[id];
  }

  describe("remove", () => {
    it("removes entity and order entry", () => {
      app.dispatch(entityList.remove({ id: "b" }));
      expect(order()).toEqual(["a", "c", "d"]);
      expect(entity("b")).toBeUndefined();
    });

    it("is no-op for unknown id", () => {
      const before = app.state.data.todoOrder;
      app.dispatch(entityList.remove({ id: "zzz" }));
      expect(app.state.data.todoOrder).toEqual(before);
    });
  });

  describe("moveUp", () => {
    it("swaps item with previous in order", () => {
      app.dispatch(entityList.moveUp({ id: "b" }));
      expect(order()).toEqual(["b", "a", "c", "d"]);
      expect(entity("b")!.text).toBe("Write tests");
    });

    it("is no-op when already first", () => {
      app.dispatch(entityList.moveUp({ id: "a" }));
      expect(order()).toEqual(["a", "b", "c", "d"]);
    });
  });

  describe("moveDown", () => {
    it("swaps item with next in order", () => {
      app.dispatch(entityList.moveDown({ id: "b" }));
      expect(order()).toEqual(["a", "c", "b", "d"]);
    });

    it("is no-op when already last", () => {
      app.dispatch(entityList.moveDown({ id: "d" }));
      expect(order()).toEqual(["a", "b", "c", "d"]);
    });
  });

  describe("duplicate", () => {
    it("creates new entity and inserts after original in order", () => {
      app.dispatch(entityList.duplicate({ id: "a" }));
      expect(order()).toHaveLength(5);
      expect(order()[0]).toBe("a");
      const newId = order()[1]!;
      expect(newId).not.toBe("a");
      expect(entity(newId)!.text).toBe("Buy milk");
      expect(entity(newId)!.completed).toBe(false);
      expect(entity(newId)!.id).toBe(newId);
    });

    it("is no-op for unknown id", () => {
      app.dispatch(entityList.duplicate({ id: "zzz" }));
      expect(order()).toHaveLength(4);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// Tests: bind() auto-wiring
// ═══════════════════════════════════════════════════════════════════

describe("createCollectionZone — bind() auto-wiring", () => {
  function dispatchAll(app: any, result: any) {
    if (Array.isArray(result)) {
      for (const cmd of result) app.dispatch(cmd);
    } else {
      app.dispatch(result);
    }
  }

  it("produces bindConfig with onDelete, onMoveUp, onMoveDown", () => {
    const bindConfig = arraySidebar.collectionBindings();
    expect(bindConfig.onDelete).toBeDefined();
    expect(bindConfig.onMoveUp).toBeDefined();
    expect(bindConfig.onMoveDown).toBeDefined();
  });

  it("onDelete produces remove command from cursor.focusId", () => {
    const bindings = arraySidebar.collectionBindings();
    const result = bindings.onDelete({ focusId: "news", selection: [] });

    const app = ArrayApp.create({ withOS: true });
    dispatchAll(app, result);
    expect(app.state.data.sections.map((s: SectionEntry) => s.id)).toEqual([
      "hero",
      "services",
      "footer",
    ]);
  });

  it("onDelete with selection produces batch remove", () => {
    const bindings = arraySidebar.collectionBindings();
    const result = bindings.onDelete({
      focusId: "hero",
      selection: ["hero", "news"],
    });

    const app = ArrayApp.create({ withOS: true });
    dispatchAll(app, result);
    expect(app.state.data.sections.map((s: SectionEntry) => s.id)).toEqual([
      "services",
      "footer",
    ]);
  });

  it("keybindings include Meta+D for duplicate", () => {
    const bindings = arraySidebar.collectionBindings();
    expect(
      bindings.keybindings.some((kb: { key: string }) => kb.key === "Meta+D"),
    ).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Tests: extractId
// ═══════════════════════════════════════════════════════════════════

describe("createCollectionZone — extractId", () => {
  const AppWithPrefix = defineApp<ArrayState>("test-prefix-v2", ARRAY_INITIAL);

  const prefixedSidebar = createCollectionZone(AppWithPrefix, "prefixed-v2", {
    accessor: (s: ArrayState) => s.data.sections,
    extractId: (focusId: string) => focusId.replace("sidebar-", ""),
  });

  it("extractId translates focusId in bindings", () => {
    const bindings = prefixedSidebar.collectionBindings();
    const result = bindings.onDelete({
      focusId: "sidebar-news",
      selection: [] as string[],
    });

    const app = AppWithPrefix.create({ withOS: true });
    if (Array.isArray(result)) {
      for (const cmd of result) app.dispatch(cmd);
    } else {
      app.dispatch(result);
    }
    expect(app.state.data.sections.map((s: SectionEntry) => s.id)).toEqual([
      "hero",
      "services",
      "footer",
    ]);
  });

  it("direct command still accepts raw entity id", () => {
    const app = AppWithPrefix.create({ withOS: true });
    app.dispatch(prefixedSidebar.remove({ id: "news" }));
    expect(app.state.data.sections.map((s: SectionEntry) => s.id)).toEqual([
      "hero",
      "services",
      "footer",
    ]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Tests: filter — category-filtered moveUp/moveDown (Todo pattern)
// ═══════════════════════════════════════════════════════════════════

describe("createCollectionZone — filtered moveUp/moveDown", () => {
  // Global order: [a(work), b(personal), c(work), d(personal)]
  // selectedCategoryId: "work" → visible: [a, c]
  let app: ReturnType<typeof EntityApp.create>;

  beforeEach(() => {
    app = EntityApp.create({ withOS: true });
  });

  function order(): string[] {
    return app.state.data.todoOrder;
  }

  it("moveDown skips non-visible items (a→c, not a→b)", () => {
    // a is first in visible [a, c]. moveDown should swap with c.
    app.dispatch(filteredList.moveDown({ id: "a" }));
    // Global: a(idx 0) and c(idx 2) swap positions → [c, b, a, d]
    expect(order()).toEqual(["c", "b", "a", "d"]);
  });

  it("moveUp skips non-visible items (c→a, not c→b)", () => {
    // c is second in visible [a, c]. moveUp should swap with a.
    app.dispatch(filteredList.moveUp({ id: "c" }));
    // Global: [c, b, a, d]
    expect(order()).toEqual(["c", "b", "a", "d"]);
  });

  it("moveDown is no-op on last visible item", () => {
    // c is last in visible [a, c]
    app.dispatch(filteredList.moveDown({ id: "c" }));
    expect(order()).toEqual(["a", "b", "c", "d"]);
  });

  it("moveUp is no-op on first visible item", () => {
    // a is first in visible [a, c]
    app.dispatch(filteredList.moveUp({ id: "a" }));
    expect(order()).toEqual(["a", "b", "c", "d"]);
  });

  it("non-visible items are not affected", () => {
    app.dispatch(filteredList.moveDown({ id: "a" }));
    // b (personal) should keep its position relative to d (personal)
    expect(app.state.data.todos["b"]!.categoryId).toBe("personal");
    expect(app.state.data.todos["d"]!.categoryId).toBe("personal");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Tests: Clipboard — copy/cut/paste
// ═══════════════════════════════════════════════════════════════════

describe("createCollectionZone — clipboard (OS-managed)", () => {
  let app: ReturnType<typeof EntityApp.create>;

  beforeEach(() => {
    _resetClipboardStore();
    app = EntityApp.create({ withOS: true });
  });

  function order(): string[] {
    return app.state.data.todoOrder;
  }

  function clipFirstItem(): any {
    return readClipboard();
  }

  describe("copy", () => {
    it("stores items in clipboard and first item is accessible", () => {
      app.dispatch(clipboardList.copy({ ids: ["a", "c"] }));
      const first = clipFirstItem();
      expect(first).toBeDefined();
      expect(first.id).toBe("a");
    });

    it("does not remove items from collection", () => {
      app.dispatch(clipboardList.copy({ ids: ["a"] }));
      expect(order()).toEqual(["a", "b", "c", "d"]);
      expect(app.state.data.todos["a"]).toBeDefined();
    });

    it("is no-op for empty ids", () => {
      app.dispatch(clipboardList.copy({ ids: [] }));
      expect(clipFirstItem()).toBeNull();
    });
  });

  describe("cut", () => {
    it("stores items in clipboard and removes them", () => {
      app.dispatch(clipboardList.cut({ ids: ["a", "c"] }));
      const first = clipFirstItem();
      expect(first).toBeDefined();
      expect(first.id).toBe("a");
      expect(order()).toEqual(["b", "d"]);
      expect(app.state.data.todos["a"]).toBeUndefined();
    });

    it("stores cut items with correct text", () => {
      app.dispatch(clipboardList.cut({ ids: ["b"] }));
      const first = clipFirstItem();
      expect(first.text).toBe("Write tests");
    });
  });

  describe("paste", () => {
    it("inserts clipboard items after focused item", () => {
      app.dispatch(clipboardList.copy({ ids: ["a"] }));
      app.dispatch(clipboardList.paste({ afterId: "b" }));
      // New item should appear after "b"
      expect(order()).toHaveLength(5);
      expect(order()[0]).toBe("a");
      expect(order()[1]).toBe("b");
      // new item at index 2
      expect(order()[3]).toBe("c");
    });

    it("applies onPaste transform (categoryId change)", () => {
      app.dispatch(clipboardList.copy({ ids: ["b"] })); // b is personal
      app.dispatch(clipboardList.paste({ afterId: "a" }));
      // Pasted item should get selectedCategoryId = "work"
      const newId = order()[1]!; // inserted after a
      expect(app.state.data.todos[newId]!.categoryId).toBe("work");
    });

    it("appends to end when no afterId", () => {
      app.dispatch(clipboardList.copy({ ids: ["a"] }));
      app.dispatch(clipboardList.paste({}));
      expect(order()).toHaveLength(5);
      expect(order()[4]).not.toBe("a"); // new item at end
    });

    it("is no-op when clipboard is empty", () => {
      app.dispatch(clipboardList.paste({ afterId: "a" }));
      expect(order()).toHaveLength(4); // unchanged
    });

    it("creates new IDs for pasted items", () => {
      app.dispatch(clipboardList.copy({ ids: ["a"] }));
      app.dispatch(clipboardList.paste({ afterId: "a" }));
      const newId = order()[1]!;
      expect(newId).not.toBe("a");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// Tests: getItems — filtered collection returns only visible items
// ═══════════════════════════════════════════════════════════════════

describe("createCollectionZone — filtered getItems", () => {
  let app: ReturnType<typeof EntityApp.create>;

  beforeEach(() => {
    app = EntityApp.create({ withOS: true });
  });

  it("getItems returns only items matching the active filter", () => {
    // selectedCategoryId = "work" → only a, c should be visible
    const bindings = filteredList.collectionBindings();
    const items = bindings.getItems();
    // Should only contain work items (a, c), not personal items (b, d)
    expect(items).toEqual(["a", "c"]);
  });

  it("unfiltered getItems returns all items", () => {
    const bindings = entityList.collectionBindings();
    const items = bindings.getItems();
    expect(items).toEqual(["a", "b", "c", "d"]);
  });
});
