/**
 * extractDropPosition — Pure function tests
 *
 * Tests the pure drop-position calculation: DropSenseInput → Drop result.
 * DOM reading (querySelectorAll + getBoundingClientRect) is done by the adapter.
 */

import { describe, expect, it } from "vitest";
import {
    extractDropPosition,
    type DropSenseInput,
} from "@os/1-listeners/shared/senseMouse";

describe("extractDropPosition (pure)", () => {
    const ITEMS: DropSenseInput["items"] = [
        { itemId: "a", top: 0, bottom: 40 },
        { itemId: "b", top: 40, bottom: 80 },
        { itemId: "c", top: 80, bottom: 120 },
    ];

    it("clientY in upper half of item → before", () => {
        const result = extractDropPosition({ clientY: 10, items: ITEMS });
        expect(result).toEqual({ overItemId: "a", position: "before" });
    });

    it("clientY in lower half of item → after", () => {
        const result = extractDropPosition({ clientY: 30, items: ITEMS });
        expect(result).toEqual({ overItemId: "a", position: "after" });
    });

    it("clientY on middle item → correct item", () => {
        const result = extractDropPosition({ clientY: 50, items: ITEMS });
        expect(result).toEqual({ overItemId: "b", position: "before" });
    });

    it("clientY outside all items → null", () => {
        const result = extractDropPosition({ clientY: 200, items: ITEMS });
        expect(result).toBeNull();
    });

    it("empty items → null", () => {
        const result = extractDropPosition({ clientY: 50, items: [] });
        expect(result).toBeNull();
    });
});
