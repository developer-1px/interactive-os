/**
 * hierarchicalNavigation — Unit tests for ZoneCallbacks + itemFilter.
 *
 * Tests that drillDown/drillUp use OS item queries (not app-level registry).
 * Tests build a minimal DOM tree because the OS item queries read DOM
 * (OS reads DOM, apps don't — the test is testing the OS+app integration).
 */

import {
  getAncestorWithAttribute,
  getFirstDescendantWithAttribute,
  getItemAttribute,
} from "@os/2-contexts/itemQueries";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { DEFAULT_CONFIG } from "@os/schemas/focus/config/FocusGroupConfig";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createCanvasItemFilter,
  createDrillDown,
  createDrillUp,
} from "../../features/hierarchicalNavigation";

const ZONE_ID = "test-canvas";

/**
 * Build a DOM tree that mirrors the Builder structure.
 * OS item queries read DOM — so tests need real DOM.
 *
 *   [zone container]
 *     s1 (section)
 *       └── g1 (group)
 *             ├── i1 (item)
 *             └── i2 (item)
 *     s2 (section)
 */
function buildTestDOM(): HTMLDivElement {
  const container = document.createElement("div");
  container.id = ZONE_ID;
  container.setAttribute("data-focus-group", ZONE_ID);

  const s1 = document.createElement("div");
  s1.setAttribute("data-item-id", "s1");
  s1.setAttribute("data-level", "section");

  const g1 = document.createElement("div");
  g1.setAttribute("data-item-id", "g1");
  g1.setAttribute("data-level", "group");

  const i1 = document.createElement("div");
  i1.setAttribute("data-item-id", "i1");
  i1.setAttribute("data-level", "item");

  const i2 = document.createElement("div");
  i2.setAttribute("data-item-id", "i2");
  i2.setAttribute("data-level", "item");

  g1.appendChild(i1);
  g1.appendChild(i2);
  s1.appendChild(g1);

  const s2 = document.createElement("div");
  s2.setAttribute("data-item-id", "s2");
  s2.setAttribute("data-level", "section");

  container.appendChild(s1);
  container.appendChild(s2);
  document.body.appendChild(container);
  return container;
}

describe("hierarchicalNavigation — OS item queries", () => {
  let container: HTMLDivElement;

  // Create callbacks curried with the test zone ID
  const drillDown = createDrillDown(ZONE_ID);
  const drillUp = createDrillUp(ZONE_ID);

  beforeEach(() => {
    container = buildTestDOM();
    ZoneRegistry.register(ZONE_ID, {
      config: { ...DEFAULT_CONFIG },
      element: container,
      parentId: null,
      itemFilter: createCanvasItemFilter(ZONE_ID),
    });
  });

  afterEach(() => {
    ZoneRegistry.unregister(ZONE_ID);
    container.remove();
  });

  // ─── OS Item Queries (OS reads DOM) ──────────────────────────

  describe("getItemAttribute", () => {
    it("reads data-level from items", () => {
      expect(getItemAttribute(ZONE_ID, "s1", "data-level")).toBe("section");
      expect(getItemAttribute(ZONE_ID, "g1", "data-level")).toBe("group");
      expect(getItemAttribute(ZONE_ID, "i1", "data-level")).toBe("item");
    });

    it("returns null for unknown items", () => {
      expect(getItemAttribute(ZONE_ID, "nonexistent", "data-level")).toBeNull();
    });
  });

  describe("getFirstDescendantWithAttribute", () => {
    it("finds first group inside section", () => {
      expect(
        getFirstDescendantWithAttribute(ZONE_ID, "s1", "data-level", "group"),
      ).toBe("g1");
    });

    it("finds first item inside section (recursive)", () => {
      expect(
        getFirstDescendantWithAttribute(ZONE_ID, "s1", "data-level", "item"),
      ).toBe("i1");
    });

    it("finds first item inside group", () => {
      expect(
        getFirstDescendantWithAttribute(ZONE_ID, "g1", "data-level", "item"),
      ).toBe("i1");
    });
  });

  describe("getAncestorWithAttribute", () => {
    it("finds section ancestor of item", () => {
      expect(
        getAncestorWithAttribute(ZONE_ID, "i1", "data-level", "section"),
      ).toBe("s1");
    });

    it("finds group ancestor of item", () => {
      expect(
        getAncestorWithAttribute(ZONE_ID, "i1", "data-level", "group"),
      ).toBe("g1");
    });

    it("finds section ancestor of group", () => {
      expect(
        getAncestorWithAttribute(ZONE_ID, "g1", "data-level", "section"),
      ).toBe("s1");
    });
  });

  // ─── App Callbacks (use OS queries, no DOM) ──────────────────

  describe("createCanvasItemFilter", () => {
    it("filters to section level by default", () => {
      const filter = createCanvasItemFilter(ZONE_ID);
      const filtered = filter(["s1", "g1", "i1", "i2", "s2"]);
      expect(filtered).toEqual(["s1", "s2"]);
    });
  });

  describe("drillDown", () => {
    it("returns FOCUS to first child group when on a section", () => {
      const result = drillDown({ focusId: "s1", selection: [], anchor: null });
      expect(result).not.toEqual([]);
      if (!Array.isArray(result)) {
        expect(result.type).toContain("FOCUS");
      }
    });

    it("returns FOCUS to first child item when on a group", () => {
      const result = drillDown({ focusId: "g1", selection: [], anchor: null });
      expect(result).not.toEqual([]);
      if (!Array.isArray(result)) {
        expect(result.type).toContain("FOCUS");
      }
    });

    it("returns FIELD_START_EDIT when on an item", () => {
      const result = drillDown({ focusId: "i1", selection: [], anchor: null });
      if (!Array.isArray(result)) {
        expect(result.type).toContain("FIELD");
      }
    });

    it("returns empty for unknown elements", () => {
      expect(
        drillDown({ focusId: "nonexistent", selection: [], anchor: null }),
      ).toEqual([]);
    });
  });

  describe("drillUp", () => {
    it("returns FOCUS to parent section when on a group", () => {
      const result = drillUp({ focusId: "g1", selection: [], anchor: null });
      expect(result).not.toEqual([]);
      if (!Array.isArray(result)) {
        expect(result.type).toContain("FOCUS");
      }
    });

    it("returns FOCUS to parent group when on an item", () => {
      const result = drillUp({ focusId: "i1", selection: [], anchor: null });
      expect(result).not.toEqual([]);
      if (!Array.isArray(result)) {
        expect(result.type).toContain("FOCUS");
      }
    });

    it("returns empty when on a section (top level)", () => {
      expect(drillUp({ focusId: "s1", selection: [], anchor: null })).toEqual(
        [],
      );
    });

    it("returns empty for unknown elements", () => {
      expect(
        drillUp({ focusId: "nonexistent", selection: [], anchor: null }),
      ).toEqual([]);
    });
  });
});
