/**
 * T19: Builder ESC → drillUp → deselect — Integration Red Test
 *
 * Tests the FULL keyboard pipeline:
 *   simulateKeyPress → resolveKeyboard → Keybindings.resolve → drillUp → OS_ESCAPE
 *
 * Previous unit tests only tested createDrillUp() directly, missing the
 * Keybindings priority bug where OS default ESC (when:"navigating")
 * shadows the builder's ESC keybinding.
 *
 * 🔴 This test MUST go through simulateKeyPress (headless keyboard pipeline).
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { createOsPage, type OsPage } from "@os/createOsPage";
import { Keybindings } from "@os/keymaps/keybindings";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createCanvasItemFilter,
  createDrillDown,
  createDrillUp,
} from "../../features/hierarchicalNavigation";

const ZONE_ID = "builder-canvas";

describe("T19 Integration: ESC through full keyboard pipeline", () => {
  let page: OsPage;
  let unregisterKeybindings: () => void;
  let container: HTMLDivElement;

  beforeEach(() => {
    // Build DOM tree with hierarchical data-level attributes
    container = document.createElement("div");
    container.id = ZONE_ID;
    container.setAttribute("data-zone", ZONE_ID);

    const s1 = document.createElement("div");
    s1.setAttribute("data-item-id", "s1");
    s1.setAttribute("data-level", "section");

    const g1 = document.createElement("div");
    g1.setAttribute("data-item-id", "g1");
    g1.setAttribute("data-level", "group");

    const i1 = document.createElement("div");
    i1.setAttribute("data-item-id", "i1");
    i1.setAttribute("data-level", "item");

    g1.appendChild(i1);
    s1.appendChild(g1);
    container.appendChild(s1);
    document.body.appendChild(container);

    // Create headless page
    page = createOsPage();
    page.goto(ZONE_ID, {
      items: ["s1", "g1", "i1"],
      config: {
        activate: { onClick: true, reClickOnly: true },
        dismiss: { escape: "none" },
      },
      onAction: createDrillDown(ZONE_ID),
    });

    // Re-register with element + itemFilter (goto doesn't set these)
    ZoneRegistry.register(ZONE_ID, {
      config: {
        activate: { onClick: true, reClickOnly: true },
        dismiss: { escape: "none" },
      } as any,
      element: container,
      parentId: null,
      itemFilter: createCanvasItemFilter(ZONE_ID),
      onAction: createDrillDown(ZONE_ID),
    });

    // Register builder keybindings (same as defineApp.bind.ts L92-96)
    unregisterKeybindings = Keybindings.registerAll([
      { key: "\\", command: createDrillUp(ZONE_ID), when: "navigating" },
      { key: "Escape", command: createDrillUp(ZONE_ID), when: "navigating" },
    ]);
  });

  afterEach(() => {
    unregisterKeybindings();
    page.cleanup();
    container.remove();
  });

  // ─── T19-1: ESC on section → deselect (focusedItemId=null) ─────
  it("section에 포커스 + ESC → focusedItemId가 null이 된다", () => {
    // Use dispatch to preserve ZoneRegistry.element (setActiveZone overwrites it)
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "s1" }));
    expect(page.focusedItemId()).toBe("s1");

    page.keyboard.press("Escape");

    // drillUp at section → no parent → OS_ESCAPE → deselect
    expect(page.focusedItemId()).toBeNull();
  });

  // ─── T19-1: ESC on item → drill up to parent ──────────────────
  it("item에 포커스 + ESC → 부모 group으로 이동", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "i1" }));
    expect(page.focusedItemId()).toBe("i1");

    page.keyboard.press("Escape");

    // drillUp at item → parent group
    expect(page.focusedItemId()).toBe("g1");
  });

  // ─── T19-1: \\ on section → deselect ──────────────────────────
  it("section + \\\\ → focusedItemId가 null이 된다", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "s1" }));
    page.keyboard.press("\\");
    expect(page.focusedItemId()).toBeNull();
  });

  // ─── T19-2: ESC and \\ produce identical results ──────────────
  it("ESC와 \\\\는 같은 결과 (item에서)", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "i1" }));
    page.keyboard.press("Escape");
    const afterEsc = page.focusedItemId();

    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "i1" }));
    page.keyboard.press("\\");
    const afterBackslash = page.focusedItemId();

    expect(afterEsc).toBe(afterBackslash);
  });
});
