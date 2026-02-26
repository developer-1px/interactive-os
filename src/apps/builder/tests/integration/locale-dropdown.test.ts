/**
 * T4: LocaleSwitcher Dropdown — createPage(BuilderApp) 통합 테스트
 *
 * @spec (pending — dropdown-dismiss spec 필요)
 *
 * Trigger의 overlay open이 OS 파이프라인을 통해 동작하는지 검증.
 * click(id) → onActivate → OS_OVERLAY_OPEN → overlay stack push
 *
 * dispatch 직접 호출 금지. click/press만 사용.
 */

import { BuilderApp } from "@apps/builder/app";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import {
    OS_OVERLAY_CLOSE,
    OS_OVERLAY_OPEN,
} from "@os/3-commands/overlay/overlay";
import { resolveRole } from "@os/registries/roleRegistry";
import { createPage } from "@os/defineApp.page";
import type { AppPage } from "@os/defineApp.types";
import type { BuilderState } from "@apps/builder/model/appState";
import { os } from "@os/kernel";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const MENU_ITEMS = [
    "locale-option-ko",
    "locale-option-en",
    "locale-add-ja",
    "locale-add-zh",
];

type Page = AppPage<BuilderState>;
let page: Page;

beforeEach(() => {
    page = createPage(BuilderApp);

    // -- Setup: Register trigger's onActivate callback --
    // In browser: FocusItem mount → Zone context → ZoneRegistry.setItemCallback
    // In headless: no React lifecycle, so we register manually
    ZoneRegistry.setItemCallback("sidebar", "locale-switcher-trigger", {
        onActivate: OS_OVERLAY_OPEN({ id: "locale-menu", type: "menu" }),
    });

    // -- Setup: Register menu zone --
    // In browser: Trigger.Portal → Zone mount → ZoneRegistry.register
    // In headless: register the menu zone that will be activated on overlay open
    const menuConfig = resolveRole("menu");
    ZoneRegistry.register("locale-menu", {
        role: "menu",
        config: menuConfig,
        element: null,
        parentId: null,
        getItems: () => MENU_ITEMS,
        onDismiss: OS_OVERLAY_CLOSE({ id: "locale-menu" }),
    });
});

afterEach(() => {
    ZoneRegistry.unregister("locale-menu");
    page.cleanup();
});

/**
 * Helper: simulate what Trigger.Portal does on overlay open.
 * In browser: Zone mounts inside dialog → autoFocus → activeZoneId = "locale-menu"
 * In headless: we activate the pre-registered menu zone after click opens overlay
 */
function openLocaleMenu() {
    page.click("locale-switcher-trigger");
    // After overlay opens, activate the menu zone with first item focused
    page.goto("locale-menu", { focusedItemId: MENU_ITEMS[0]! });
}

describe("T4: LocaleSwitcher — 사용자 행동만으로 검증", () => {
    // ── 열기 ──

    it("trigger 클릭 → overlay stack에 locale-menu 추가", () => {
        page.click("locale-switcher-trigger");
        const stack = os.getState().os.overlays.stack;
        expect(stack.some((e: any) => e.id === "locale-menu")).toBe(true);
    });

    // ── Navigation ──

    it("menu 열림 → ArrowDown → 다음 item", () => {
        openLocaleMenu();
        expect(page.focusedItemId()).toBe("locale-option-ko"); // first item
        page.keyboard.press("ArrowDown");
        expect(page.focusedItemId()).toBe("locale-option-en");
    });

    // ── Dismiss ──

    it("Escape → overlay 닫힘", () => {
        openLocaleMenu();
        page.keyboard.press("Escape");
        expect(os.getState().os.overlays.stack.length).toBe(0);
    });
});
