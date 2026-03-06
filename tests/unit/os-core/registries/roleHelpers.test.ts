/**
 * Role Registry Helpers — Unit Tests
 *
 * Tests for getChildRole helper.
 * This utility feeds into ARIA attribute rendering.
 */

import { getChildRole } from "@os-core/engine/registries/roleRegistry";
import { describe, expect, it } from "vitest";

describe("getChildRole", () => {
  it.each([
    ["listbox", "option"],
    ["menu", "menuitem"],
    ["menubar", "menuitem"],
    ["radiogroup", "radio"],
    ["tablist", "tab"],
    ["toolbar", "button"],
    ["grid", "gridcell"],
    ["treegrid", "row"],
    ["tree", "treeitem"],
    ["combobox", "option"],
    ["feed", "article"],
    ["accordion", "button"],
  ])('role="%s" → child="%s"', (zoneRole, expectedChild) => {
    expect(getChildRole(zoneRole)).toBe(expectedChild);
  });

  it("falls back to 'option' for unknown role", () => {
    expect(getChildRole("unknown")).toBe("option");
  });

  it("falls back to 'option' for undefined", () => {
    expect(getChildRole(undefined)).toBe("option");
  });
});
