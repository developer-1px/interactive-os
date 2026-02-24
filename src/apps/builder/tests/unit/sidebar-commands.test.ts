/**
 * sidebarCommands — Unit tests for section management commands.
 *
 * Tests deleteSection, duplicateSection, moveSectionUp, moveSectionDown
 * using BuilderApp.create() test instance (headless, no DOM).
 *
 * Top-level blocks (GreenEye preset):
 *   ge-hero, ge-tab-nav, ge-related-services, ge-section-footer, ge-footer
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  BuilderApp,
  deleteSection,
  duplicateSection,
  moveSectionDown,
  moveSectionUp,
} from "../../app";

describe("sidebar section commands", () => {
  let app: ReturnType<typeof BuilderApp.create>;

  beforeEach(() => {
    app = BuilderApp.create({ withOS: true });
  });

  function sectionIds(): string[] {
    return app.state.data.blocks.map((s) => s.id);
  }

  const ALL_IDS = [
    "ge-hero",
    "ge-tab-nav",
    "ge-related-services",
    "ge-section-footer",
    "ge-footer",
  ];

  // ─── deleteSection ────────────────────────────────────────────

  describe("deleteSection", () => {
    it("removes the section from the list", () => {
      expect(sectionIds()).toContain("ge-tab-nav");

      app.dispatch(deleteSection({ id: "ge-tab-nav" }));

      expect(sectionIds()).not.toContain("ge-tab-nav");
      expect(app.state.data.blocks).toHaveLength(4);
    });

    it("does not modify state for unknown section", () => {
      const before = app.state.data.blocks;
      app.dispatch(deleteSection({ id: "nonexistent" }));
      expect(app.state.data.blocks).toEqual(before);
    });

    it("preserves order of remaining sections", () => {
      app.dispatch(deleteSection({ id: "ge-tab-nav" }));
      expect(sectionIds()).toEqual([
        "ge-hero",
        "ge-related-services",
        "ge-section-footer",
        "ge-footer",
      ]);
    });
  });

  // ─── duplicateSection ─────────────────────────────────────────

  describe("duplicateSection", () => {
    it("inserts a copy after the original", () => {
      app.dispatch(duplicateSection({ id: "ge-hero" }));

      expect(app.state.data.blocks).toHaveLength(6);
      // Original stays at index 0, copy is at index 1
      expect(app.state.data.blocks[0]!.id).toBe("ge-hero");
      expect(app.state.data.blocks[1]!.label).toBe("Product Hero (copy)");
      expect(app.state.data.blocks[1]!.type).toBe("ncp-product-hero");
    });

    it("preserves the rest of the list", () => {
      app.dispatch(duplicateSection({ id: "ge-tab-nav" }));

      // ge-hero, ge-tab-nav, ge-tab-nav-copy, ge-related-services, ge-section-footer, ge-footer
      expect(app.state.data.blocks).toHaveLength(6);
      expect(app.state.data.blocks[0]!.id).toBe("ge-hero");
      expect(app.state.data.blocks[1]!.id).toBe("ge-tab-nav");
      expect(app.state.data.blocks[3]!.id).toBe("ge-related-services");
      expect(app.state.data.blocks[4]!.id).toBe("ge-section-footer");
      expect(app.state.data.blocks[5]!.id).toBe("ge-footer");
    });

    it("does nothing for unknown section", () => {
      app.dispatch(duplicateSection({ id: "nonexistent" }));
      expect(app.state.data.blocks).toHaveLength(5);
    });
  });

  // ─── moveSectionUp ────────────────────────────────────────────

  describe("moveSectionUp", () => {
    it("swaps section with previous sibling", () => {
      app.dispatch(moveSectionUp({ id: "ge-tab-nav" }));
      expect(sectionIds()).toEqual([
        "ge-tab-nav",
        "ge-hero",
        "ge-related-services",
        "ge-section-footer",
        "ge-footer",
      ]);
    });

    it("does nothing when already first", () => {
      app.dispatch(moveSectionUp({ id: "ge-hero" }));
      expect(sectionIds()).toEqual(ALL_IDS);
    });
  });

  // ─── moveSectionDown ──────────────────────────────────────────

  describe("moveSectionDown", () => {
    it("swaps section with next sibling", () => {
      app.dispatch(moveSectionDown({ id: "ge-tab-nav" }));
      expect(sectionIds()).toEqual([
        "ge-hero",
        "ge-related-services",
        "ge-tab-nav",
        "ge-section-footer",
        "ge-footer",
      ]);
    });

    it("does nothing when already last", () => {
      app.dispatch(moveSectionDown({ id: "ge-footer" }));
      expect(sectionIds()).toEqual(ALL_IDS);
    });
  });
});
