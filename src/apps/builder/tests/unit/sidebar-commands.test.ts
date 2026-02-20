/**
 * sidebarCommands — Unit tests for section management commands.
 *
 * Tests deleteSection, duplicateSection, moveSectionUp, moveSectionDown
 * using BuilderApp.create() test instance (headless, no DOM).
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

  // Initial blocks: ncp-hero, ncp-news, ncp-services, ncp-pricing, tab-container-1, ncp-footer

  // ─── deleteSection ────────────────────────────────────────────

  describe("deleteSection", () => {
    it("removes the section from the list", () => {
      expect(sectionIds()).toContain("ncp-news");

      app.dispatch(deleteSection({ id: "ncp-news" }));

      expect(sectionIds()).not.toContain("ncp-news");
      expect(app.state.data.blocks).toHaveLength(5);
    });

    it("does not modify state for unknown section", () => {
      const before = app.state.data.blocks;
      app.dispatch(deleteSection({ id: "nonexistent" }));
      expect(app.state.data.blocks).toEqual(before);
    });

    it("preserves order of remaining sections", () => {
      app.dispatch(deleteSection({ id: "ncp-news" }));
      expect(sectionIds()).toEqual(["ncp-hero", "ncp-services", "ncp-pricing", "tab-container-1", "ncp-footer"]);
    });
  });

  // ─── duplicateSection ─────────────────────────────────────────

  describe("duplicateSection", () => {
    it("inserts a copy after the original", () => {
      app.dispatch(duplicateSection({ id: "ncp-hero" }));

      expect(app.state.data.blocks).toHaveLength(7);
      // Original stays at index 0, copy is at index 1
      expect(app.state.data.blocks[0]!.id).toBe("ncp-hero");
      expect(app.state.data.blocks[1]!.label).toBe("Hero (copy)");
      expect(app.state.data.blocks[1]!.type).toBe("hero");
    });

    it("preserves the rest of the list", () => {
      app.dispatch(duplicateSection({ id: "ncp-news" }));

      // ncp-hero, ncp-news, ncp-news-copy-..., ncp-services, ncp-pricing, tab-container-1, ncp-footer
      expect(app.state.data.blocks).toHaveLength(7);
      expect(app.state.data.blocks[0]!.id).toBe("ncp-hero");
      expect(app.state.data.blocks[1]!.id).toBe("ncp-news");
      expect(app.state.data.blocks[3]!.id).toBe("ncp-services");
      expect(app.state.data.blocks[4]!.id).toBe("ncp-pricing");
      expect(app.state.data.blocks[5]!.id).toBe("tab-container-1");
      expect(app.state.data.blocks[6]!.id).toBe("ncp-footer");
    });

    it("does nothing for unknown section", () => {
      app.dispatch(duplicateSection({ id: "nonexistent" }));
      expect(app.state.data.blocks).toHaveLength(6);
    });
  });

  // ─── moveSectionUp ────────────────────────────────────────────

  describe("moveSectionUp", () => {
    it("swaps section with previous sibling", () => {
      app.dispatch(moveSectionUp({ id: "ncp-news" }));
      expect(sectionIds()).toEqual([
        "ncp-news",
        "ncp-hero",
        "ncp-services",
        "ncp-pricing",
        "tab-container-1",
        "ncp-footer",
      ]);
    });

    it("does nothing when already first", () => {
      app.dispatch(moveSectionUp({ id: "ncp-hero" }));
      expect(sectionIds()).toEqual([
        "ncp-hero",
        "ncp-news",
        "ncp-services",
        "ncp-pricing",
        "tab-container-1",
        "ncp-footer",
      ]);
    });
  });

  // ─── moveSectionDown ──────────────────────────────────────────

  describe("moveSectionDown", () => {
    it("swaps section with next sibling", () => {
      app.dispatch(moveSectionDown({ id: "ncp-news" }));
      expect(sectionIds()).toEqual([
        "ncp-hero",
        "ncp-services",
        "ncp-news",
        "ncp-pricing",
        "tab-container-1",
        "ncp-footer",
      ]);
    });

    it("does nothing when already last", () => {
      app.dispatch(moveSectionDown({ id: "ncp-footer" }));
      expect(sectionIds()).toEqual([
        "ncp-hero",
        "ncp-news",
        "ncp-services",
        "ncp-pricing",
        "tab-container-1",
        "ncp-footer",
      ]);
    });
  });
});
