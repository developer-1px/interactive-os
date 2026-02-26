/**
 * tree-ops — Full enumeration of tree-aware collection operations.
 *
 * Rule #14 (Spec-First, Enumerate-All): All cases from platform precedents
 * (macOS Finder, Windows Explorer, Figma Layers) enumerated before implementation.
 *
 * Cases:
 *   X2: nested cut       — remove from parent.children + clipboard
 *   D2: nested delete    — remove from parent.children
 *   M2: nested moveUp/Down — swap within parent.children
 *   U2: nested duplicate — clone within parent.children
 */

import {
  BuilderApp,
  deleteSection,
  duplicateSection,
  moveSectionDown,
  moveSectionUp,
  sidebarCollection,
} from "@apps/builder/app";
import { beforeEach, describe, expect, it } from "vitest";
import { _resetClipboardStore } from "@/os/collection/createCollectionZone";
import { findInTree } from "@/os/collection/treeUtils";
import { TREE_TEST_BLOCKS } from "../fixtures/treeTestBlocks";

describe("tree-aware collection operations", () => {
  let app: ReturnType<typeof BuilderApp.create>;

  beforeEach(() => {
    _resetClipboardStore();
    app = BuilderApp.create({
      withOS: true,
      data: { blocks: structuredClone(TREE_TEST_BLOCKS) },
    } as any);
  });

  // ═══════════════════════════════════════════════════════════════
  // D2: nested delete
  // ═══════════════════════════════════════════════════════════════

  describe("D2: nested delete", () => {
    it("removes a section from its parent tab's children", () => {
      const tab = findInTree(app.state.data.blocks, "tab-1-overview")!;
      expect(tab.children!.length).toBe(1);

      app.dispatch(deleteSection({ id: "tab-1-overview-s1" }));

      const updatedTab = findInTree(app.state.data.blocks, "tab-1-overview")!;
      expect(updatedTab.children!.length).toBe(0);
      // Root blocks unchanged
      expect(app.state.data.blocks.length).toBe(6);
    });

    it("removes a tab from its parent tab-container's children", () => {
      const container = findInTree(app.state.data.blocks, "tab-container-1")!;
      expect(container.children!.length).toBe(3);

      app.dispatch(deleteSection({ id: "tab-1-faq" }));

      const updatedContainer = findInTree(
        app.state.data.blocks,
        "tab-container-1",
      )!;
      expect(updatedContainer.children!.length).toBe(2);
      expect(app.state.data.blocks.length).toBe(6);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // X2: nested cut
  // ═══════════════════════════════════════════════════════════════

  describe("X2: nested cut", () => {
    it("cuts a nested section: removes from parent + stores in clipboard", () => {
      app.dispatch(sidebarCollection.cut({ ids: ["tab-1-overview-s1"] }));

      // Removed from parent
      const tab = findInTree(app.state.data.blocks, "tab-1-overview")!;
      expect(tab.children!.length).toBe(0);

      // Root blocks unchanged
      expect(app.state.data.blocks.length).toBe(6);
    });

    it("cut nested → paste elsewhere: moves the node", () => {
      app.dispatch(sidebarCollection.cut({ ids: ["tab-1-overview-s1"] }));

      // Paste into tab-1-details (accept: section)
      app.dispatch(sidebarCollection.paste({ afterId: "tab-1-details" }));

      // Source tab has 0 children
      const srcTab = findInTree(app.state.data.blocks, "tab-1-overview")!;
      expect(srcTab.children!.length).toBe(0);

      // Destination tab has 2 children (original + pasted)
      const dstTab = findInTree(app.state.data.blocks, "tab-1-details")!;
      expect(dstTab.children!.length).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // M2: nested moveUp/Down
  // ═══════════════════════════════════════════════════════════════

  describe("M2: nested moveUp/Down", () => {
    it("moveDown swaps a tab with its next sibling within the container", () => {
      const container = findInTree(app.state.data.blocks, "tab-container-1")!;
      const originalOrder = container.children!.map((c) => c.id);
      expect(originalOrder).toEqual([
        "tab-1-overview",
        "tab-1-details",
        "tab-1-faq",
      ]);

      app.dispatch(moveSectionDown({ id: "tab-1-overview" }));

      const updated = findInTree(app.state.data.blocks, "tab-container-1")!;
      expect(updated.children!.map((c) => c.id)).toEqual([
        "tab-1-details",
        "tab-1-overview",
        "tab-1-faq",
      ]);
    });

    it("moveUp swaps a tab with its previous sibling within the container", () => {
      app.dispatch(moveSectionUp({ id: "tab-1-faq" }));

      const updated = findInTree(app.state.data.blocks, "tab-container-1")!;
      expect(updated.children!.map((c) => c.id)).toEqual([
        "tab-1-overview",
        "tab-1-faq",
        "tab-1-details",
      ]);
    });

    it("moveUp on first child does nothing", () => {
      app.dispatch(moveSectionUp({ id: "tab-1-overview" }));

      const updated = findInTree(app.state.data.blocks, "tab-container-1")!;
      expect(updated.children!.map((c) => c.id)).toEqual([
        "tab-1-overview",
        "tab-1-details",
        "tab-1-faq",
      ]);
    });

    it("moveDown on last child does nothing", () => {
      app.dispatch(moveSectionDown({ id: "tab-1-faq" }));

      const updated = findInTree(app.state.data.blocks, "tab-container-1")!;
      expect(updated.children!.map((c) => c.id)).toEqual([
        "tab-1-overview",
        "tab-1-details",
        "tab-1-faq",
      ]);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // U2: nested duplicate
  // ═══════════════════════════════════════════════════════════════

  describe("U2: nested duplicate", () => {
    it("duplicates a tab within the same container", () => {
      app.dispatch(duplicateSection({ id: "tab-1-overview" }));

      const container = findInTree(app.state.data.blocks, "tab-container-1")!;
      expect(container.children!.length).toBe(4); // 3 + 1
      // Clone is right after original
      expect(container.children![0]!.id).toBe("tab-1-overview");
      expect(container.children![1]!.type).toBe("tab");
      expect(container.children![1]!.id).not.toBe("tab-1-overview"); // new ID
    });

    it("duplicates a section within the same tab", () => {
      app.dispatch(duplicateSection({ id: "tab-1-overview-s1" }));

      const tab = findInTree(app.state.data.blocks, "tab-1-overview")!;
      expect(tab.children!.length).toBe(2); // 1 + 1
      expect(tab.children![0]!.id).toBe("tab-1-overview-s1");
      expect(tab.children![1]!.type).toBe("section");
    });

    it("root blocks unchanged after nested duplicate", () => {
      app.dispatch(duplicateSection({ id: "tab-1-overview" }));
      expect(app.state.data.blocks.length).toBe(6);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MOVE: atomic cross-parent move (no clipboard)
  // ═══════════════════════════════════════════════════════════════

  describe("move (atomic)", () => {
    it("moves a section from one tab to another (preserves ID)", () => {
      app.dispatch(
        sidebarCollection.move({
          id: "tab-1-overview-s1",
          toParentId: "tab-1-details",
        }),
      );

      // Source tab empty
      const srcTab = findInTree(app.state.data.blocks, "tab-1-overview")!;
      expect(srcTab.children!.length).toBe(0);

      // Destination has 2 (original + moved)
      const dstTab = findInTree(app.state.data.blocks, "tab-1-details")!;
      expect(dstTab.children!.length).toBe(2);

      // ID is preserved (not cloned)
      expect(dstTab.children!.some((c) => c.id === "tab-1-overview-s1")).toBe(
        true,
      );
    });

    it("move respects accept constraints", () => {
      // Try to move a section directly to tab-container-1 (accept: ["tab"])
      app.dispatch(
        sidebarCollection.move({
          id: "tab-1-overview-s1",
          toParentId: "tab-container-1",
        }),
      );

      // Should be rejected — section is still in original place
      const srcTab = findInTree(app.state.data.blocks, "tab-1-overview")!;
      expect(srcTab.children!.length).toBe(1);
    });

    it("move with afterId positions correctly", () => {
      app.dispatch(
        sidebarCollection.move({
          id: "tab-1-faq",
          toParentId: "tab-container-1",
          afterId: "tab-1-overview",
        }),
      );

      const container = findInTree(app.state.data.blocks, "tab-container-1")!;
      expect(container.children!.map((c) => c.id)).toEqual([
        "tab-1-overview",
        "tab-1-faq",
        "tab-1-details",
      ]);
    });

    it("root blocks unchanged after nested move", () => {
      app.dispatch(
        sidebarCollection.move({
          id: "tab-1-overview-s1",
          toParentId: "tab-1-details",
        }),
      );
      expect(app.state.data.blocks.length).toBe(6);
    });
  });
});
