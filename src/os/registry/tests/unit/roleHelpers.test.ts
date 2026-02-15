/**
 * Role Registry Helpers — Unit Tests
 *
 * Tests for getChildRole, isCheckedRole, isExpandableRole helpers.
 * These are small utility functions but they feed into ARIA attribute rendering.
 */

import { describe, expect, it } from "vitest";
import {
    getChildRole,
    isCheckedRole,
    isExpandableRole,
} from "@os/registry/roleRegistry";

describe("getChildRole", () => {
    it.each([
        ["listbox", "option"],
        ["menu", "menuitem"],
        ["menubar", "menuitem"],
        ["radiogroup", "radio"],
        ["tablist", "tab"],
        ["toolbar", "button"],
        ["grid", "gridcell"],
        ["treegrid", "gridcell"],
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

describe("isCheckedRole", () => {
    it.each(["radio", "menuitemradio", "menuitemcheckbox", "checkbox", "switch"])(
        '"%s" → true',
        (role) => {
            expect(isCheckedRole(role)).toBe(true);
        },
    );

    it.each(["option", "menuitem", "tab", "treeitem", "button"])(
        '"%s" → false',
        (role) => {
            expect(isCheckedRole(role)).toBe(false);
        },
    );
});

describe("isExpandableRole", () => {
    it.each(["treeitem", "menuitem"])('"%s" → true', (role) => {
        expect(isExpandableRole(role)).toBe(true);
    });

    it.each(["option", "radio", "tab", "button", "gridcell"])(
        '"%s" → false',
        (role) => {
            expect(isExpandableRole(role)).toBe(false);
        },
    );
});
