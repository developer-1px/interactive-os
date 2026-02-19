/**
 * createCollectionZone — Unit tests (TDD Red Phase)
 *
 * Tests the Collection Zone Facade:
 *   - Two data shapes: Array (Builder) and Entity+Order (Todo)
 *   - Auto-generated commands: remove, moveUp, moveDown, duplicate
 *   - normalize/denormalize roundtrip integrity
 *   - fromArray / fromEntities presets
 *
 * These tests drive the API design. The implementation does not exist yet.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { z } from "zod";
import { defineApp } from "@/os/defineApp";
import {
    createCollectionZone,
    fromArray,
    fromEntities,
} from "@/os/collection/createCollectionZone";

// ═══════════════════════════════════════════════════════════════════
// Test Fixture A: Array-based collection (Builder pattern)
// ═══════════════════════════════════════════════════════════════════

const SectionSchema = z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(["hero", "news", "services", "footer"]),
});

interface SectionEntry {
    id: string;
    label: string;
    type: "hero" | "news" | "services" | "footer";
}

interface ArrayState {
    data: {
        sections: SectionEntry[];
    };
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

// ═══════════════════════════════════════════════════════════════════
// Test Fixture B: Entity+Order collection (Todo pattern)
// ═══════════════════════════════════════════════════════════════════

const TodoSchema = z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
});

interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

interface EntityState {
    data: {
        todos: Record<string, Todo>;
        todoOrder: string[];
    };
    history: { past: any[]; future: any[] };
}

const ENTITY_INITIAL: EntityState = {
    data: {
        todos: {
            a: { id: "a", text: "Buy milk", completed: false },
            b: { id: "b", text: "Write tests", completed: true },
            c: { id: "c", text: "Ship it", completed: false },
        },
        todoOrder: ["a", "b", "c"],
    },
    history: { past: [], future: [] },
};

// ═══════════════════════════════════════════════════════════════════
// Fixture A: Array-based Collection App
// ═══════════════════════════════════════════════════════════════════

const ArrayApp = defineApp<ArrayState>("test-array", ARRAY_INITIAL);

const arraySidebar = createCollectionZone(ArrayApp, "sidebar", {
    schema: SectionSchema,
    ...fromArray((s: ArrayState) => s.data.sections),
});

// ═══════════════════════════════════════════════════════════════════
// Fixture B: Entity+Order Collection App
// ═══════════════════════════════════════════════════════════════════

const EntityApp = defineApp<EntityState>("test-entity", ENTITY_INITIAL);

const entityList = createCollectionZone(EntityApp, "list", {
    schema: TodoSchema,
    ...fromEntities(
        (s: EntityState) => s.data.todos,
        (s: EntityState) => s.data.todoOrder,
    ),
});

// ═══════════════════════════════════════════════════════════════════
// Tests: Array-based collection (Builder pattern)
// ═══════════════════════════════════════════════════════════════════

describe("createCollectionZone — Array (Builder pattern)", () => {
    let app: ReturnType<typeof ArrayApp.create>;

    beforeEach(() => {
        app = ArrayApp.create();
    });

    function ids(): string[] {
        return app.state.data.sections.map((s) => s.id);
    }

    // ─── remove ────────────────────────────────────────────────────

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

    // ─── moveUp ────────────────────────────────────────────────────

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

    // ─── moveDown ──────────────────────────────────────────────────

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

    // ─── duplicate ─────────────────────────────────────────────────

    describe("duplicate", () => {
        it("inserts copy after original", () => {
            app.dispatch(arraySidebar.duplicate({ id: "hero" }));
            expect(app.state.data.sections).toHaveLength(5);
            expect(app.state.data.sections[0]!.id).toBe("hero");
            // Copy should be at index 1 with same type
            expect(app.state.data.sections[1]!.type).toBe("hero");
            // Copy should have different id
            expect(app.state.data.sections[1]!.id).not.toBe("hero");
        });

        it("is no-op for unknown id", () => {
            app.dispatch(arraySidebar.duplicate({ id: "nonexistent" }));
            expect(app.state.data.sections).toHaveLength(4);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════
// Tests: Entity+Order collection (Todo pattern)
// ═══════════════════════════════════════════════════════════════════

describe("createCollectionZone — Entity+Order (Todo pattern)", () => {
    let app: ReturnType<typeof EntityApp.create>;

    beforeEach(() => {
        app = EntityApp.create();
    });

    function order(): string[] {
        return app.state.data.todoOrder;
    }

    function entity(id: string): Todo | undefined {
        return app.state.data.todos[id];
    }

    // ─── remove ────────────────────────────────────────────────────

    describe("remove", () => {
        it("removes entity and order entry", () => {
            app.dispatch(entityList.remove({ id: "b" }));
            expect(order()).toEqual(["a", "c"]);
            expect(entity("b")).toBeUndefined();
        });

        it("is no-op for unknown id", () => {
            const before = app.state.data.todoOrder;
            app.dispatch(entityList.remove({ id: "zzz" }));
            expect(app.state.data.todoOrder).toEqual(before);
        });
    });

    // ─── moveUp ────────────────────────────────────────────────────

    describe("moveUp", () => {
        it("swaps item with previous in order", () => {
            app.dispatch(entityList.moveUp({ id: "b" }));
            expect(order()).toEqual(["b", "a", "c"]);
            // Entities untouched
            expect(entity("b")!.text).toBe("Write tests");
        });

        it("is no-op when already first", () => {
            app.dispatch(entityList.moveUp({ id: "a" }));
            expect(order()).toEqual(["a", "b", "c"]);
        });
    });

    // ─── moveDown ──────────────────────────────────────────────────

    describe("moveDown", () => {
        it("swaps item with next in order", () => {
            app.dispatch(entityList.moveDown({ id: "b" }));
            expect(order()).toEqual(["a", "c", "b"]);
        });

        it("is no-op when already last", () => {
            app.dispatch(entityList.moveDown({ id: "c" }));
            expect(order()).toEqual(["a", "b", "c"]);
        });
    });

    // ─── duplicate ─────────────────────────────────────────────────

    describe("duplicate", () => {
        it("creates new entity and inserts after original in order", () => {
            app.dispatch(entityList.duplicate({ id: "a" }));
            expect(order()).toHaveLength(4);
            // Original stays at index 0
            expect(order()[0]).toBe("a");
            // New item at index 1 with different id
            const newId = order()[1]!;
            expect(newId).not.toBe("a");
            // New entity has same data
            expect(entity(newId)!.text).toBe("Buy milk");
            expect(entity(newId)!.completed).toBe(false);
            // New entity has its own id
            expect(entity(newId)!.id).toBe(newId);
        });

        it("is no-op for unknown id", () => {
            app.dispatch(entityList.duplicate({ id: "zzz" }));
            expect(order()).toHaveLength(3);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════
// Tests: normalize/denormalize roundtrip
// ═══════════════════════════════════════════════════════════════════

describe("normalize/denormalize roundtrip", () => {
    it("fromArray roundtrip preserves data", () => {
        const adapter = fromArray((s: ArrayState) => s.data.sections);
        const normalized = adapter.normalize(ARRAY_INITIAL);

        expect(normalized.ids).toEqual(["hero", "news", "services", "footer"]);
        expect(normalized.entities["hero"]).toEqual(ARRAY_INITIAL.data.sections[0]);
    });

    it("fromEntities roundtrip preserves data", () => {
        const adapter = fromEntities(
            (s: EntityState) => s.data.todos,
            (s: EntityState) => s.data.todoOrder,
        );
        const normalized = adapter.normalize(ENTITY_INITIAL);

        expect(normalized.ids).toEqual(["a", "b", "c"]);
        expect(normalized.entities["a"]).toEqual(ENTITY_INITIAL.data.todos["a"]);
    });
});
