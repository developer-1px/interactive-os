/**
 * Level 1: Unit Tests — fuzzyMatch pure function
 *
 * Tests the scoring and matching logic of the Command Palette's search engine.
 */

import { describe, expect, it } from "vitest";
import { fuzzyMatch } from "../../fuzzyMatch";

describe("fuzzyMatch — basic matching", () => {
    it("returns null when query does not subsequence-match target", () => {
        expect(fuzzyMatch("xyz", "home")).toBeNull();
    });

    it("returns score 0 and empty indices for empty query", () => {
        const result = fuzzyMatch("", "anything");
        expect(result).toEqual({ score: 0, matchedIndices: [] });
    });

    it("returns exact match with highest score", () => {
        const result = fuzzyMatch("home", "home");
        expect(result).not.toBeNull();
        if (result) {
            expect(result.score).toBeGreaterThan(100);
            expect(result.matchedIndices).toEqual([0, 1, 2, 3]);
        }
    });

    it("matches case-insensitively", () => {
        const result = fuzzyMatch("ho", "Home");
        expect(result).not.toBeNull();
        if (result) {
            expect(result.matchedIndices).toEqual([0, 1]);
        }
    });
});

describe("fuzzyMatch — scoring", () => {
    it("scores prefix matches higher than mid-string matches", () => {
        const prefix = fuzzyMatch("ho", "home");
        const mid = fuzzyMatch("ho", "echo");
        expect(prefix).not.toBeNull();
        expect(mid).not.toBeNull();
        if (prefix && mid) {
            expect(prefix.score).toBeGreaterThan(mid.score);
        }
    });

    it("scores word-boundary matches higher", () => {
        const boundary = fuzzyMatch("rl", "useRouteList");
        expect(boundary).not.toBeNull();
        if (boundary) {
            // R and L are at camelCase boundaries
            expect(boundary.matchedIndices).toContain(3); // R
            expect(boundary.matchedIndices).toContain(8); // L
        }
    });

    it("scores consecutive matches higher than scattered", () => {
        const consecutive = fuzzyMatch("pro", "profile");
        const scattered = fuzzyMatch("pro", "playground/projects/route");
        expect(consecutive).not.toBeNull();
        expect(scattered).not.toBeNull();
        if (consecutive && scattered) {
            expect(consecutive.score).toBeGreaterThan(scattered.score);
        }
    });

    it("scores shorter targets higher (more specific)", () => {
        const short = fuzzyMatch("docs", "/docs");
        const long = fuzzyMatch("docs", "/documents/explorer");
        expect(short).not.toBeNull();
        expect(long).not.toBeNull();
        if (short && long) {
            expect(short.score).toBeGreaterThan(long.score);
        }
    });
});

describe("fuzzyMatch — indices", () => {
    it("returns correct matched indices for subsequence", () => {
        const result = fuzzyMatch("bd", "builder");
        expect(result).not.toBeNull();
        if (result) {
            // b=0, d=4 (buil[d]er)
            expect(result.matchedIndices[0]).toBe(0);
            expect(result.matchedIndices).toContain(4);
        }
    });
});
