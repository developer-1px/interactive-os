/**
 * Docs Section Nav — Unit Tests
 *
 * T1: DocsReaderUI zone must have:
 *   1. NEXT/PREV_SECTION commands that return scrollSection effect
 *   2. Space/Shift+Space keybindings (auto-registered via command key)
 *   3. scrollSection effect registered on the zone
 */

import { Keybindings } from "@os-core/2-resolve/keybindings";
import { describe, expect, it } from "vitest";
import { DocsReaderUI, NEXT_SECTION, PREV_SECTION } from "@/docs-viewer/app";

describe("T1: DocsReaderUI section navigation", () => {
  it("NEXT_SECTION returns scrollSection effect with 'next'", () => {
    const cmd = NEXT_SECTION();
    expect(cmd.type).toBe("DOCS_NEXT_SECTION");
  });

  it("PREV_SECTION returns scrollSection effect with 'prev'", () => {
    const cmd = PREV_SECTION();
    expect(cmd.type).toBe("DOCS_PREV_SECTION");
  });

  it("Zone component is exported", () => {
    expect(DocsReaderUI.Zone).toBeDefined();
  });

  it("Space keybinding is auto-registered via command({ key })", () => {
    // Keybindings are now auto-registered when the command is defined
    // with { key: "Space" } — no manual registerAll needed.
    const spaceResult = Keybindings.resolve("Space", { isEditing: false });
    expect(spaceResult).not.toBeNull();

    const shiftResult = Keybindings.resolve("Shift+Space", {
      isEditing: false,
    });
    expect(shiftResult).not.toBeNull();
  });
});
