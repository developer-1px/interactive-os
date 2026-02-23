/**
 * fromNormalized — Tree-aware entity adapter tests (TDD Red)
 *
 * Unlike fromEntities (flat string[]), fromNormalized handles
 * Record<string, string[]> order (adjacency list).
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
    createCollectionZone,
    fromNormalized,
} from "@/os/collection/createCollectionZone";
import { defineApp } from "@/os/defineApp";

// ═══════════════════════════════════════════════════════════════════
// Fixture: Tree-shaped entity collection
// ═══════════════════════════════════════════════════════════════════

interface DocEntity {
    id: string;
    name: string;
    type: "folder" | "file";
}

interface TreeState {
    data: {
        docs: Record<string, DocEntity>;
        docOrder: Record<string, string[]>;
    };
    history: { past: any[]; future: any[] };
}

const TREE_INITIAL: TreeState = {
    data: {
        docs: {
            "folder:api": { id: "folder:api", name: "api", type: "folder" },
            "api/auth": { id: "api/auth", name: "auth.ts", type: "file" },
            "api/users": { id: "api/users", name: "users.ts", type: "file" },
            "folder:docs": { id: "folder:docs", name: "docs", type: "folder" },
            "docs/readme": { id: "docs/readme", name: "readme.md", type: "file" },
        },
        docOrder: {
            "": ["folder:api", "folder:docs"],
            "folder:api": ["api/auth", "api/users"],
            "folder:docs": ["docs/readme"],
        },
    },
    history: { past: [], future: [] },
};

const TreeApp = defineApp<TreeState>("test-tree-normalized", TREE_INITIAL);

const treeCollection = createCollectionZone(TreeApp, "doc-tree", {
    ...fromNormalized(
        (s: TreeState) => s.data.docs,
        (s: TreeState) => s.data.docOrder,
    ),
});

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe("fromNormalized — tree-aware CRUD", () => {
    let app: ReturnType<typeof TreeApp.create>;

    beforeEach(() => {
        app = TreeApp.create({ withOS: true });
    });

    function order() {
        return app.state.data.docOrder;
    }

    function entities() {
        return app.state.data.docs;
    }

    describe("getItems (via collectionBindings)", () => {
        it("returns all entities flattened (DFS order)", () => {
            const bindings = treeCollection.collectionBindings();
            const items = bindings.getItems();
            expect(items).toEqual([
                "folder:api", "api/auth", "api/users",
                "folder:docs", "docs/readme",
            ]);
        });
    });

    describe("remove", () => {
        it("removes leaf entity from parent children", () => {
            app.dispatch(treeCollection.remove({ id: "api/auth" }));
            expect(order()["folder:api"]).toEqual(["api/users"]);
            expect(entities()["api/auth"]).toBeUndefined();
        });

        it("removes folder and all descendants recursively", () => {
            app.dispatch(treeCollection.remove({ id: "folder:api" }));
            expect(order()[""]).toEqual(["folder:docs"]);
            expect(entities()["folder:api"]).toBeUndefined();
            expect(entities()["api/auth"]).toBeUndefined();
            expect(entities()["api/users"]).toBeUndefined();
            expect(order()["folder:api"]).toBeUndefined();
        });
    });

    describe("moveUp / moveDown", () => {
        it("swaps root-level siblings via getSiblings", () => {
            app.dispatch(treeCollection.moveDown({ id: "folder:api" }));
            expect(order()[""]).toEqual(["folder:docs", "folder:api"]);
        });

        it("swaps child-level siblings", () => {
            app.dispatch(treeCollection.moveDown({ id: "api/auth" }));
            expect(order()["folder:api"]).toEqual(["api/users", "api/auth"]);
        });

        it("is no-op when already first", () => {
            app.dispatch(treeCollection.moveUp({ id: "folder:api" }));
            expect(order()[""]).toEqual(["folder:api", "folder:docs"]);
        });
    });

    describe("duplicate", () => {
        it("duplicates leaf and inserts after original in same parent", () => {
            app.dispatch(treeCollection.duplicate({ id: "api/auth" }));
            expect(order()["folder:api"]).toHaveLength(3);
            expect(order()["folder:api"]![0]).toBe("api/auth");
            const newId = order()["folder:api"]![1]!;
            expect(newId).not.toBe("api/auth");
            expect(entities()[newId]!.name).toBe("auth.ts");
        });
    });
});
