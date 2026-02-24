/**
 * T21: forceDeselect → zone 비활성화
 *
 * Figma 표준: ESC로 전부 해제 후 Arrow 무반응.
 * 다시 클릭해야 재진입.
 *
 * 기존 builder-esc-deselect.test.ts에서 ESC → null까지는 검증됨.
 * 이 테스트는 "null 이후" 동작을 검증:
 *   - Arrow → 여전히 null (키보드 무반응)
 *   - Click → 재진입
 *
 * Full Path: press("Escape") → press("ArrowUp") → focusedItemId still null
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

describe("T21: forceDeselect → zone deactivation", () => {
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

    const s2 = document.createElement("div");
    s2.setAttribute("data-item-id", "s2");
    s2.setAttribute("data-level", "section");

    container.appendChild(s1);
    container.appendChild(s2);
    document.body.appendChild(container);

    page = createOsPage();
    page.goto(ZONE_ID, {
      items: ["s1", "s2"],
      config: {
        activate: { onClick: true, reClickOnly: true },
        dismiss: { escape: "none" },
      },
      onAction: createDrillDown(ZONE_ID),
    });

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

  it("#1 ESC on section → focusedItemId=null (기존 동작 확인)", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "s1" }));
    expect(page.focusedItemId()).toBe("s1");

    page.keyboard.press("Escape");

    expect(page.focusedItemId()).toBeNull();
  });

  it("#2 ESC → ArrowDown → focusedItemId 여전히 null", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "s1" }));
    page.keyboard.press("Escape");
    expect(page.focusedItemId()).toBeNull();

    page.keyboard.press("ArrowDown");

    expect(page.focusedItemId()).toBeNull();
  });

  it("#3 ESC → ArrowUp → focusedItemId 여전히 null", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "s1" }));
    page.keyboard.press("Escape");
    expect(page.focusedItemId()).toBeNull();

    page.keyboard.press("ArrowUp");

    expect(page.focusedItemId()).toBeNull();
  });

  it("#4 ESC → Click → 재진입", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "s1" }));
    page.keyboard.press("Escape");
    expect(page.focusedItemId()).toBeNull();

    // In browser: click DOM resolves zoneId from data-zone attribute.
    // In headless: must specify zoneId explicitly since activeZoneId=null.
    page.click("s2", { zoneId: ZONE_ID });

    expect(page.focusedItemId()).toBe("s2");
  });
});
