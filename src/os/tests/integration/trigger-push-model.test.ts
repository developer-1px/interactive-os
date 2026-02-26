/**
 * trigger-listener-gap: Push Model for onActivate
 *
 * @spec (architecture — no Decision Table needed)
 *
 * 검증: zone.bind에 triggers를 선언하면,
 * goto() 시 자동으로 setItemCallback이 호출되어
 * page.click(id)가 수동 setup 없이 동작한다.
 *
 * 핵심 원칙: FocusItem useLayoutEffect 없이도 onActivate 동작.
 */

import { BuilderApp } from "@apps/builder/app";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OS_OVERLAY_OPEN } from "@os/3-commands/overlay/overlay";
import { createPage } from "@os/defineApp.page";
import type { AppPage } from "@os/defineApp.types";
import type { BuilderState } from "@apps/builder/model/appState";
import { os } from "@os/kernel";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

type Page = AppPage<BuilderState>;
let page: Page;

beforeEach(() => {
    page = createPage(BuilderApp);
});

afterEach(() => {
    page.cleanup();
});

describe("Push Model: zone.bind triggers → goto auto-registration", () => {
    it("goto('sidebar') 후 click('locale-switcher-trigger') → overlay open (수동 setup 0)", () => {
        // goto만으로 sidebar zone의 trigger callbacks이 자동 등록되어야 함
        // 수동 ZoneRegistry.setItemCallback 호출 없음!
        page.goto("sidebar");

        page.click("locale-switcher-trigger");

        const stack = os.getState().os.overlays.stack;
        expect(stack.some((e: any) => e.id === "locale-menu")).toBe(true);
    });

    it("goto가 등록한 trigger callback이 findItemCallback으로 발견됨", () => {
        page.goto("sidebar");

        const cb = ZoneRegistry.findItemCallback("locale-switcher-trigger");
        expect(cb).toBeDefined();
        expect(cb?.onActivate).toBeDefined();
    });
});
