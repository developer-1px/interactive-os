/**
 * resolveEscape Unit Tests — OS SPEC §3.5
 *
 * Tests the pure escape/dismiss resolver:
 * - deselect: clears selection (only if selection exists)
 * - close: always closes
 * - none: no action
 */

import { resolveEscape } from "@os/3-commands/interaction/resolveEscape";
import { describe, expect, it } from "vitest";

describe("resolveEscape (SPEC §3.5)", () => {
  describe("deselect", () => {
    it("returns 'deselect' when selection exists", () => {
      expect(resolveEscape("deselect", true)).toEqual({ action: "deselect" });
    });

    it("returns 'none' when no selection", () => {
      expect(resolveEscape("deselect", false)).toEqual({ action: "none" });
    });
  });

  describe("close", () => {
    it("always returns 'close'", () => {
      expect(resolveEscape("close", false)).toEqual({ action: "close" });
    });

    it("returns 'close' even with selection", () => {
      expect(resolveEscape("close", true)).toEqual({ action: "close" });
    });
  });

  describe("none", () => {
    it("returns 'none' regardless of selection", () => {
      expect(resolveEscape("none", false)).toEqual({ action: "none" });
      expect(resolveEscape("none", true)).toEqual({ action: "none" });
    });
  });
});
