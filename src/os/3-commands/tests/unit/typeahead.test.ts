/**
 * Typeahead Unit Tests — OS SPEC §3.2 (Navigate Config: typeahead)
 *
 * W3C APG Typeahead Behavior:
 * - Single character typed → focus moves to next item starting with that character
 * - Rapid consecutive characters → treated as search prefix (e.g., "fo" matches "Foo")
 * - After timeout (~500ms), buffer resets
 * - Only active when config.navigate.typeahead === true
 *
 * Tests the pure `resolveTypeahead` function.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { resolveTypeahead, resetTypeaheadBuffer } from "@os/3-commands/navigate/typeahead";

// ═══════════════════════════════════════════════════════════════════
// Test Data
// ═══════════════════════════════════════════════════════════════════

const LABELS = new Map<string, string>([
    ["apple", "Apple"],
    ["avocado", "Avocado"],
    ["banana", "Banana"],
    ["blueberry", "Blueberry"],
    ["cherry", "Cherry"],
    ["date", "Date"],
]);

const ITEMS = Array.from(LABELS.keys());

beforeEach(() => {
    resetTypeaheadBuffer();
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

// ═══════════════════════════════════════════════════════════════════
// Single Character Typeahead
// ═══════════════════════════════════════════════════════════════════

describe("Typeahead: Single Character (SPEC §3.2)", () => {
    it("typing 'b' focuses first item starting with 'b'", () => {
        const result = resolveTypeahead("apple", "b", ITEMS, LABELS);
        expect(result).toBe("banana");
    });

    it("typing 'c' focuses first item starting with 'c'", () => {
        const result = resolveTypeahead("apple", "c", ITEMS, LABELS);
        expect(result).toBe("cherry");
    });

    it("typing 'd' focuses first item starting with 'd'", () => {
        const result = resolveTypeahead("apple", "d", ITEMS, LABELS);
        expect(result).toBe("date");
    });

    it("typing same character cycles through matches", () => {
        const r1 = resolveTypeahead("apple", "b", ITEMS, LABELS);
        expect(r1).toBe("banana");

        vi.advanceTimersByTime(600); // reset buffer

        const r2 = resolveTypeahead("banana", "b", ITEMS, LABELS);
        expect(r2).toBe("blueberry");

        vi.advanceTimersByTime(600);

        const r3 = resolveTypeahead("blueberry", "b", ITEMS, LABELS);
        expect(r3).toBe("banana"); // wraps
    });

    it("no match → returns null (no change)", () => {
        const result = resolveTypeahead("apple", "z", ITEMS, LABELS);
        expect(result).toBeNull();
    });

    it("case insensitive matching", () => {
        const result = resolveTypeahead("apple", "B", ITEMS, LABELS);
        expect(result).toBe("banana");
    });
});

// ═══════════════════════════════════════════════════════════════════
// Multi-Character Prefix
// ═══════════════════════════════════════════════════════════════════

describe("Typeahead: Multi-Character Prefix (SPEC §3.2)", () => {
    it('"bl" matches "Blueberry" over "Banana"', () => {
        resolveTypeahead("apple", "b", ITEMS, LABELS);
        vi.advanceTimersByTime(100); // within buffer window
        const result = resolveTypeahead("banana", "l", ITEMS, LABELS);
        expect(result).toBe("blueberry");
    });

    it('"av" matches "Avocado" over "Apple"', () => {
        resolveTypeahead("cherry", "a", ITEMS, LABELS);
        vi.advanceTimersByTime(100);
        const result = resolveTypeahead("apple", "v", ITEMS, LABELS);
        expect(result).toBe("avocado");
    });

    it("buffer resets after timeout", () => {
        resolveTypeahead("apple", "b", ITEMS, LABELS);
        vi.advanceTimersByTime(600); // reset buffer (>500ms)

        // Now 'l' should be a fresh search, not 'bl'
        const result = resolveTypeahead("banana", "l", ITEMS, LABELS);
        expect(result).toBeNull(); // no items start with 'l'
    });
});

// ═══════════════════════════════════════════════════════════════════
// Edge Cases
// ═══════════════════════════════════════════════════════════════════

describe("Typeahead: Edge Cases", () => {
    it("empty items → null", () => {
        const result = resolveTypeahead(null, "a", [], new Map());
        expect(result).toBeNull();
    });

    it("null currentId → finds first match", () => {
        const result = resolveTypeahead(null, "b", ITEMS, LABELS);
        expect(result).toBe("banana");
    });

    it("special keys (Space, Enter) are ignored", () => {
        const r1 = resolveTypeahead("apple", " ", ITEMS, LABELS);
        expect(r1).toBeNull();

        const r2 = resolveTypeahead("apple", "Enter", ITEMS, LABELS);
        expect(r2).toBeNull();
    });
});
