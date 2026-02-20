/**
 * treeUtils — Pure tree traversal utilities for nested Block-like structures.
 *
 * Works on any `{ id: string; children?: T[] }` tree.
 * Designed to work on both readonly state and Immer drafts.
 */

import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Import the utilities under test
// ═══════════════════════════════════════════════════════════════════

import {
    findInTree,
    findParentOf,
    removeFromTree,
    insertChild,
} from "@/os/collection/treeUtils";

// ═══════════════════════════════════════════════════════════════════
// Test data — 3-tier tree: tabs → tab → section
// ═══════════════════════════════════════════════════════════════════

interface TestNode {
    id: string;
    type: string;
    accept?: string[];
    children?: TestNode[];
}

function makeTree(): TestNode[] {
    return [
        { id: "hero", type: "hero" },
        {
            id: "tabs-1", type: "tabs", accept: ["tab"],
            children: [
                {
                    id: "tab-a", type: "tab", accept: ["section"],
                    children: [
                        { id: "sec-1", type: "section" },
                        { id: "sec-2", type: "section" },
                    ],
                },
                {
                    id: "tab-b", type: "tab", accept: ["section"],
                    children: [
                        { id: "sec-3", type: "section" },
                    ],
                },
            ],
        },
        { id: "footer", type: "footer" },
    ];
}

// ═══════════════════════════════════════════════════════════════════
// findInTree
// ═══════════════════════════════════════════════════════════════════

describe("findInTree", () => {
    it("finds a root-level node", () => {
        const tree = makeTree();
        expect(findInTree(tree, "hero")?.id).toBe("hero");
    });

    it("finds a deeply nested node", () => {
        const tree = makeTree();
        expect(findInTree(tree, "sec-2")?.id).toBe("sec-2");
    });

    it("returns undefined for unknown id", () => {
        const tree = makeTree();
        expect(findInTree(tree, "nonexistent")).toBeUndefined();
    });

    it("finds intermediate nodes (tab)", () => {
        const tree = makeTree();
        expect(findInTree(tree, "tab-a")?.id).toBe("tab-a");
    });
});

// ═══════════════════════════════════════════════════════════════════
// findParentOf
// ═══════════════════════════════════════════════════════════════════

describe("findParentOf", () => {
    it("returns undefined for root-level nodes", () => {
        const tree = makeTree();
        expect(findParentOf(tree, "hero")).toBeUndefined();
    });

    it("finds parent of a tab (container → tab)", () => {
        const tree = makeTree();
        expect(findParentOf(tree, "tab-a")?.id).toBe("tabs-1");
    });

    it("finds parent of a section (tab → section)", () => {
        const tree = makeTree();
        expect(findParentOf(tree, "sec-2")?.id).toBe("tab-a");
    });

    it("returns undefined for unknown id", () => {
        const tree = makeTree();
        expect(findParentOf(tree, "nonexistent")).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════════
// removeFromTree
// ═══════════════════════════════════════════════════════════════════

describe("removeFromTree", () => {
    it("removes a root-level node", () => {
        const tree = makeTree();
        const removed = removeFromTree(tree, "hero");
        expect(removed).toBe(true);
        expect(tree.length).toBe(2);
        expect(findInTree(tree, "hero")).toBeUndefined();
    });

    it("removes a deeply nested node", () => {
        const tree = makeTree();
        const removed = removeFromTree(tree, "sec-2");
        expect(removed).toBe(true);
        const tabA = findInTree(tree, "tab-a")!;
        expect(tabA.children!.length).toBe(1);
        expect(tabA.children![0]!.id).toBe("sec-1");
    });

    it("returns false for unknown id", () => {
        const tree = makeTree();
        expect(removeFromTree(tree, "nonexistent")).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════
// insertChild
// ═══════════════════════════════════════════════════════════════════

describe("insertChild", () => {
    it("inserts at the end of parent's children", () => {
        const tree = makeTree();
        const newNode: TestNode = { id: "sec-new", type: "section" };
        insertChild(tree, "tab-a", newNode);
        const tabA = findInTree(tree, "tab-a")!;
        expect(tabA.children!.length).toBe(3);
        expect(tabA.children![2]!.id).toBe("sec-new");
    });

    it("inserts after a specific sibling", () => {
        const tree = makeTree();
        const newNode: TestNode = { id: "sec-new", type: "section" };
        insertChild(tree, "tab-a", newNode, "sec-1");
        const tabA = findInTree(tree, "tab-a")!;
        expect(tabA.children!.length).toBe(3);
        expect(tabA.children![0]!.id).toBe("sec-1");
        expect(tabA.children![1]!.id).toBe("sec-new");
        expect(tabA.children![2]!.id).toBe("sec-2");
    });

    it("creates children array if parent has none", () => {
        const tree = makeTree();
        const newNode: TestNode = { id: "child-1", type: "tab" };
        insertChild(tree, "hero", newNode);
        const hero = findInTree(tree, "hero")!;
        expect(hero.children!.length).toBe(1);
        expect(hero.children![0]!.id).toBe("child-1");
    });

    it("does nothing if parent not found", () => {
        const tree = makeTree();
        const newNode: TestNode = { id: "orphan", type: "section" };
        insertChild(tree, "nonexistent", newNode);
        expect(findInTree(tree, "orphan")).toBeUndefined();
    });
});
