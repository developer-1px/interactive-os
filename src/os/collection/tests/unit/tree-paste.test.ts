/**
 * tree-paste — Tests for tree-aware paste in createCollectionZone.
 *
 * When pasting on a node that has `accept` matching the clipboard item's type:
 *   → item is inserted as a CHILD of that node.
 * When accept doesn't match or node has no accept:
 *   → item is inserted as a SIBLING (current behavior).
 */

import { BuilderApp, sidebarCollection } from "@apps/builder/app";
import type { Block } from "@apps/builder/model/appState";
import { beforeEach, describe, expect, it } from "vitest";
import { _resetClipboardStore } from "@/os/collection/createCollectionZone";
import { findInTree } from "@/os/collection/treeUtils";

describe("tree-aware paste", () => {
  let app: ReturnType<typeof BuilderApp.create>;

  beforeEach(() => {
    _resetClipboardStore();
    app = BuilderApp.create({ withOS: true });
  });

  function blocks(): Block[] {
    return app.state.data.blocks;
  }

  it("paste on a tab node (accept: section) inserts as child", () => {
    // Find a section to copy
    const tabContainer = findInTree(blocks(), "tab-container-1")!;
    const tab = tabContainer.children![0]!; // tab-1-overview
    const section = tab.children![0]!; // tab-1-overview-s1

    // Copy the section
    app.dispatch(sidebarCollection.copy({ ids: [section.id] }));

    // Paste on tab-1-details (which has accept: ["section"])
    app.dispatch(sidebarCollection.paste({ afterId: "tab-1-details" }));

    // The pasted section should be a child of tab-1-details,
    // NOT a sibling of it in the tabs container
    const updatedTab = findInTree(app.state.data.blocks, "tab-1-details")!;
    expect(updatedTab.children!.length).toBe(2); // original sec + pasted
  });

  it("paste on a tabs node (accept: tab) inserts tab as child", () => {
    // Copy a tab
    const tab = findInTree(blocks(), "tab-1-overview")!;
    app.dispatch(sidebarCollection.copy({ ids: [tab.id] }));

    // Paste on tab-container-1 (which has accept: ["tab"])
    app.dispatch(sidebarCollection.paste({ afterId: "tab-container-1" }));

    // The pasted tab should be a child of tab-container-1
    const updatedContainer = findInTree(
      app.state.data.blocks,
      "tab-container-1",
    )!;
    expect(updatedContainer.children!.length).toBe(4); // 3 original + 1 pasted
  });

  it("paste on a node without accept inserts as sibling (existing behavior)", () => {
    const heroId = blocks()[0]!.id; // ncp-hero, no accept
    app.dispatch(sidebarCollection.copy({ ids: [heroId] }));

    // Paste on ncp-news (no accept) → sibling
    app.dispatch(sidebarCollection.paste({ afterId: "ncp-news" }));

    // Should be a new top-level block after ncp-news
    const topIds = app.state.data.blocks.map((b) => b.id);
    expect(topIds.length).toBe(7); // 6 original + 1 pasted
    // Pasted after ncp-news (index 1), so it's at index 2
    expect(app.state.data.blocks[2]!.type).toBe("hero");
  });

  it("accept mismatch: section pasted on tabs container goes as sibling", () => {
    // Copy a section
    const section = findInTree(blocks(), "tab-1-overview-s1")!;
    app.dispatch(sidebarCollection.copy({ ids: [section.id] }));

    // Paste on tab-container-1 (accept: ["tab"], not "section")
    app.dispatch(sidebarCollection.paste({ afterId: "tab-container-1" }));

    // Section type doesn't match tab container's accept (["tab"]),
    // so it should be inserted as a sibling in the top-level blocks
    const topLevelCount = app.state.data.blocks.length;
    expect(topLevelCount).toBe(7); // 6 + 1 sibling
  });

  it("paste on a nested leaf inserts as sibling within the same parent (not at root)", () => {
    // Copy a section
    const section = findInTree(blocks(), "tab-1-overview-s1")!;
    app.dispatch(sidebarCollection.copy({ ids: [section.id] }));

    // Paste on the same section (tab-1-overview-s1)
    // It's nested inside tab-1-overview, which has accept: ["section"]
    // But the TARGET (section) has no accept → should insert as sibling within tab-1-overview
    app.dispatch(sidebarCollection.paste({ afterId: "tab-1-overview-s1" }));

    // Should NOT add to root-level blocks
    expect(app.state.data.blocks.length).toBe(6); // unchanged at root

    // Should add as sibling within tab-1-overview's children
    const tab = findInTree(app.state.data.blocks, "tab-1-overview")!;
    expect(tab.children!.length).toBe(2); // original + pasted
    // Pasted right AFTER tab-1-overview-s1 (index 0), so at index 1
    expect(tab.children![0]!.id).toBe("tab-1-overview-s1");
    expect(tab.children![1]!.type).toBe("section");
  });

  it("paste position is preserved: inserted after the focused node, not appended", () => {
    // Add a second section to tab-1-overview first
    const sec = findInTree(blocks(), "tab-1-details-s1")!;
    app.dispatch(sidebarCollection.copy({ ids: [sec.id] }));
    app.dispatch(sidebarCollection.paste({ afterId: "tab-1-details" }));

    // Now tab-1-details has 2 sections
    const tab = findInTree(app.state.data.blocks, "tab-1-details")!;
    expect(tab.children!.length).toBe(2);
    const firstChildId = tab.children![0]!.id; // tab-1-details-s1

    // Copy another section and paste after the FIRST child
    const hero = blocks()[0]!;
    app.dispatch(sidebarCollection.copy({ ids: [hero.id] }));
    app.dispatch(sidebarCollection.paste({ afterId: firstChildId }));

    // Should be inserted after firstChildId, not at the end
    const updatedTab = findInTree(app.state.data.blocks, "tab-1-details")!;
    expect(updatedTab.children!.length).toBe(3);
    expect(updatedTab.children![0]!.id).toBe(firstChildId);
    // Pasted item at index 1 (after firstChildId)
    expect(updatedTab.children![1]!.type).toBe("hero");
  });
});
