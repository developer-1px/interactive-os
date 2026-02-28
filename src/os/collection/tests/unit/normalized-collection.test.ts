/**
 * NormalizedCollection — Query tests
 *
 * Universal collection format: { entities, order }.
 * order[""] = root items, order[parentId] = children.
 *
 * Mutations are handled by fromNormalized (Immer draft), not here.
 */

import {
  getAllIds,
  createCollection,
  getChildren,
  getParent,
  getRoots,
  type NormalizedCollection,
} from "@os/collection/NormalizedCollection";
import { describe, expect, it } from "vitest";

// ── Fixtures ──

interface TestItem {
  id: string;
  label: string;
}

function flatFixture(): NormalizedCollection<TestItem> {
  return createCollection(
    {
      a: { id: "a", label: "A" },
      b: { id: "b", label: "B" },
      c: { id: "c", label: "C" },
    },
    { "": ["a", "b", "c"] },
  );
}

function treeFixture(): NormalizedCollection<TestItem> {
  return createCollection(
    {
      root: { id: "root", label: "Root" },
      child1: { id: "child1", label: "Child 1" },
      child2: { id: "child2", label: "Child 2" },
      grandchild: { id: "grandchild", label: "Grandchild" },
    },
    {
      "": ["root"],
      root: ["child1", "child2"],
      child1: ["grandchild"],
    },
  );
}

// ═══════════════════════════════════════════════════════════════════
// Query helpers
// ═══════════════════════════════════════════════════════════════════

describe("NormalizedCollection: queries", () => {
  it("getRoots returns root-level ids in order", () => {
    expect(getRoots(flatFixture())).toEqual(["a", "b", "c"]);
    expect(getRoots(treeFixture())).toEqual(["root"]);
  });

  it("getChildren returns ordered children of a parent", () => {
    const tree = treeFixture();
    expect(getChildren(tree, "root")).toEqual(["child1", "child2"]);
    expect(getChildren(tree, "child1")).toEqual(["grandchild"]);
    expect(getChildren(tree, "child2")).toEqual([]);
    expect(getChildren(tree, "grandchild")).toEqual([]);
  });

  it("getParent returns parent id or null for root", () => {
    const tree = treeFixture();
    expect(getParent(tree, "root")).toBe(null);
    expect(getParent(tree, "child1")).toBe("root");
    expect(getParent(tree, "grandchild")).toBe("child1");
  });

  it("getAllIds returns every entity id", () => {
    const ids = getAllIds(flatFixture());
    expect(ids.sort()).toEqual(["a", "b", "c"]);

    const treeIds = getAllIds(treeFixture());
    expect(treeIds.sort()).toEqual(["child1", "child2", "grandchild", "root"]);
  });
});
