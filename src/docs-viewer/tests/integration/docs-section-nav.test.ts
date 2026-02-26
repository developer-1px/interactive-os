/**
 * T1 Integration: DocsReader section navigation — Full keyboard pipeline
 *
 * Tests the FULL pipeline:
 *   simulateKeyPress → resolveKeyboard → Keybindings.resolve
 *   → DOCS_NEXT/PREV_SECTION → scrollSection effect
 *
 * Key assertions:
 *   1. Space → DOCS_NEXT_SECTION (not OS_SELECT)
 *   2. Shift+Space → DOCS_PREV_SECTION
 *   3. Space × N → scrollSection effect called N times (not stuck at 1)
 */

import { defineScope } from "@kernel";
import { createOsPage, type OsPage } from "@os/createOsPage";
import { Keybindings } from "@os/keymaps/keybindings";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NEXT_SECTION, PREV_SECTION } from "@/docs-viewer/app";

const ZONE_ID = "docs-reader";

describe("T1 Integration: Space/Shift+Space through full keyboard pipeline", () => {
  let page: OsPage;
  let unregisterKeybindings: () => void;
  let scrollSectionSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    page = createOsPage();

    // Docs-reader is a "feed" zone — no items, no cursor.
    page.goto(ZONE_ID, {
      role: "feed",
      focusedItemId: null,
    });

    // Create the same scope hierarchy as defineApp → createZone.
    // In production: defineApp("docs-viewer") → createZone("docs-reader")
    //   → scope = defineScope("docs-viewer:docs-reader")
    //   → group = parentGroup.group({ scope })
    const appScope = defineScope("docs-viewer");
    const appGroup = page.kernel.group({ scope: appScope });
    const zoneScope = defineScope("docs-viewer:docs-reader");
    const zoneGroup = appGroup.group({ scope: zoneScope });

    // Register command handlers in the correct scope
    zoneGroup.defineCommand("DOCS_NEXT_SECTION", () => () => ({
      scrollSection: "next" as const,
    }));
    zoneGroup.defineCommand("DOCS_PREV_SECTION", () => () => ({
      scrollSection: "prev" as const,
    }));

    // Register scrollSection effect in the zone scope
    scrollSectionSpy = vi.fn();
    zoneGroup.defineEffect("scrollSection", scrollSectionSpy);

    // Register app keybindings (same as defineApp.bind.ts useEffect)
    unregisterKeybindings = Keybindings.registerAll([
      { key: "Space", command: NEXT_SECTION(), when: "navigating" },
      { key: "Shift+Space", command: PREV_SECTION(), when: "navigating" },
    ]);
  });

  afterEach(() => {
    unregisterKeybindings();
    page.cleanup();
  });

  // ── #1: Space → DOCS_NEXT_SECTION, not OS_SELECT ──────────────
  it("#1 Space → DOCS_NEXT_SECTION dispatched", () => {
    page.keyboard.press("Space");

    const lastTx = page.kernel.inspector.getLastTransaction();
    expect(lastTx).not.toBeNull();
    expect(lastTx!.command.type).toBe("DOCS_NEXT_SECTION");
  });

  // ── #2: Shift+Space → DOCS_PREV_SECTION ───────────────────────
  it("#2 Shift+Space → DOCS_PREV_SECTION dispatched", () => {
    page.keyboard.press("Shift+Space");

    const lastTx = page.kernel.inspector.getLastTransaction();
    expect(lastTx).not.toBeNull();
    expect(lastTx!.command.type).toBe("DOCS_PREV_SECTION");
  });

  // ── #3: Space invokes scrollSection("next") effect ─────────────
  it("#3 Space → scrollSection effect called with 'next'", () => {
    page.keyboard.press("Space");

    expect(scrollSectionSpy).toHaveBeenCalledTimes(1);
    expect(scrollSectionSpy).toHaveBeenCalledWith("next");
  });

  // ── #4: Shift+Space invokes scrollSection("prev") effect ───────
  it("#4 Shift+Space → scrollSection effect called with 'prev'", () => {
    page.keyboard.press("Shift+Space");

    expect(scrollSectionSpy).toHaveBeenCalledTimes(1);
    expect(scrollSectionSpy).toHaveBeenCalledWith("prev");
  });

  // ── #5: Space × 3 → scrollSection called 3 times ──────────────
  it("#5 Space pressed 3 times → scrollSection effect called 3 times", () => {
    page.keyboard.press("Space");
    page.keyboard.press("Space");
    page.keyboard.press("Space");

    expect(scrollSectionSpy).toHaveBeenCalledTimes(3);
    expect(scrollSectionSpy).toHaveBeenNthCalledWith(1, "next");
    expect(scrollSectionSpy).toHaveBeenNthCalledWith(2, "next");
    expect(scrollSectionSpy).toHaveBeenNthCalledWith(3, "next");
  });
});
