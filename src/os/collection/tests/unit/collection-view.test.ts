/**
 * collectionView — View Transform tests (TDD Red)
 *
 * toFlatList:    NormalizedCollection → string[] (root order)
 * toVisibleTree: NormalizedCollection + expandedIds → FlatNode[]
 * toGrouped:     NormalizedCollection + groupBy fn → Map<G, T[]>
 */

import {
  toFlatList,
  toGrouped,
  toVisibleTree,
} from "@os/collection/collectionView";
import { createCollection } from "@os/collection/NormalizedCollection";
import { describe, expect, it } from "vitest";

// ── Fixtures ──────────────────────────────────────────────────────

interface Item {
  id: string;
  label: string;
  status?: "todo" | "doing" | "done";
  type?: "folder" | "file";
}

function flatFixture() {
  return createCollection<Item>(
    {
      a: { id: "a", label: "A", status: "todo" },
      b: { id: "b", label: "B", status: "doing" },
      c: { id: "c", label: "C", status: "todo" },
      d: { id: "d", label: "D", status: "done" },
    },
    { "": ["a", "b", "c", "d"] },
  );
}

function treeFixture() {
  return createCollection<Item>(
    {
      "folder:api": { id: "folder:api", label: "api", type: "folder" },
      "api/auth": { id: "api/auth", label: "auth.ts", type: "file" },
      "api/users": { id: "api/users", label: "users.ts", type: "file" },
      "folder:docs": { id: "folder:docs", label: "docs", type: "folder" },
      "docs/readme": { id: "docs/readme", label: "readme.md", type: "file" },
    },
    {
      "": ["folder:api", "folder:docs"],
      "folder:api": ["api/auth", "api/users"],
      "folder:docs": ["docs/readme"],
    },
  );
}

// ═══════════════════════════════════════════════════════════════════
// toFlatList
// ═══════════════════════════════════════════════════════════════════

describe("toFlatList", () => {
  it("returns root ids in order", () => {
    expect(toFlatList(flatFixture())).toEqual(["a", "b", "c", "d"]);
  });

  it("returns only root ids for a tree (not children)", () => {
    expect(toFlatList(treeFixture())).toEqual(["folder:api", "folder:docs"]);
  });

  it("returns empty array for empty collection", () => {
    expect(toFlatList(createCollection({}, { "": [] }))).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// toVisibleTree
// ═══════════════════════════════════════════════════════════════════

describe("toVisibleTree", () => {
  it("returns only roots when nothing expanded", () => {
    const nodes = toVisibleTree(treeFixture(), []);
    expect(nodes).toHaveLength(2);
    expect(nodes.map((n) => n.id)).toEqual(["folder:api", "folder:docs"]);
  });

  it("includes children of expanded folder", () => {
    const nodes = toVisibleTree(treeFixture(), ["folder:api"]);
    expect(nodes.map((n) => n.id)).toEqual([
      "folder:api",
      "api/auth",
      "api/users",
      "folder:docs",
    ]);
  });

  it("includes all children when all expanded", () => {
    const nodes = toVisibleTree(treeFixture(), ["folder:api", "folder:docs"]);
    expect(nodes.map((n) => n.id)).toEqual([
      "folder:api",
      "api/auth",
      "api/users",
      "folder:docs",
      "docs/readme",
    ]);
  });

  it("sets correct level for each node", () => {
    const nodes = toVisibleTree(treeFixture(), ["folder:api"]);
    const levels = Object.fromEntries(nodes.map((n) => [n.id, n.level]));
    expect(levels["folder:api"]).toBe(0);
    expect(levels["api/auth"]).toBe(1);
    expect(levels["api/users"]).toBe(1);
    expect(levels["folder:docs"]).toBe(0);
  });

  it("marks expandable nodes (those with children in order)", () => {
    const nodes = toVisibleTree(treeFixture(), ["folder:api"]);
    const expandable = Object.fromEntries(
      nodes.map((n) => [n.id, n.expandable]),
    );
    expect(expandable["folder:api"]).toBe(true);
    expect(expandable["api/auth"]).toBe(false);
    expect(expandable["folder:docs"]).toBe(true);
  });

  it("works for flat collections (level = 0, not expandable)", () => {
    const nodes = toVisibleTree(flatFixture(), []);
    expect(nodes.every((n) => n.level === 0)).toBe(true);
    expect(nodes.every((n) => !n.expandable)).toBe(true);
    expect(nodes.map((n) => n.id)).toEqual(["a", "b", "c", "d"]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// toGrouped
// ═══════════════════════════════════════════════════════════════════

describe("toGrouped", () => {
  it("groups root entities by groupBy fn", () => {
    const c = flatFixture();
    const grouped = toGrouped(c, (item) => item.status!);
    expect(grouped.get("todo")!.map((i) => i.id)).toEqual(["a", "c"]);
    expect(grouped.get("doing")!.map((i) => i.id)).toEqual(["b"]);
    expect(grouped.get("done")!.map((i) => i.id)).toEqual(["d"]);
  });

  it("preserves order within groups", () => {
    const c = flatFixture();
    const grouped = toGrouped(c, (item) => item.status!);
    expect(grouped.get("todo")!.map((i) => i.id)).toEqual(["a", "c"]);
  });

  it("returns empty map for empty collection", () => {
    const grouped = toGrouped(createCollection({}, { "": [] }), () => "x");
    expect(grouped.size).toBe(0);
  });
});
