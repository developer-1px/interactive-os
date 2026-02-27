/**
 * @spec docs/1-project/headless-zone-registry/spec.md#T2
 *
 * T2: autoFocus headless pathway
 *
 * 핵심 증명: createOsPage를 통해 autoFocus가 headless에서도 작동한다.
 * React 렌더 없이 OS API만으로 검증.
 *
 * Tier 1: OS 커널 아키텍처 테스트
 */

import { afterEach, describe, expect, it } from "vitest";
import { createOsPage, type OsPage } from "@os/createOsPage";

// ═══════════════════════════════════════════════════════════════════
// Tests — autoFocus via createOsPage (headless OS API)
// ═══════════════════════════════════════════════════════════════════

describe("T2: FocusGroup autoFocus headless pathway", () => {
    let page: OsPage;

    afterEach(() => page?.cleanup());

    // T2-1: autoFocus dispatches OS_FOCUS with first item from getItems()
    it("T2-1: autoFocus dispatches OS_FOCUS with first item from getItems()", () => {
        page = createOsPage();
        page.goto("autofocus-test", {
            items: ["item-a", "item-b", "item-c"],
            role: "dialog",
            config: { project: { autoFocus: true } },
        });

        expect(page.activeZoneId()).toBe("autofocus-test");
        expect(page.focusedItemId()).toBe("item-a");
    });

    // T2-3: autoFocus with empty items activates zone only (itemId=null)
    it("T2-3: autoFocus with empty getItems activates zone only (itemId=null)", () => {
        page = createOsPage();
        page.goto("autofocus-test", {
            items: [],
            role: "dialog",
            config: { project: { autoFocus: true } },
        });

        expect(page.activeZoneId()).toBe("autofocus-test");
        expect(page.focusedItemId()).toBeNull();
    });

    // T2-4: headless autoFocus sets activeZoneId
    it("T2-4: headless autoFocus sets activeZoneId", () => {
        page = createOsPage();
        page.goto("autofocus-test", {
            items: ["x"],
            role: "dialog",
            config: { project: { autoFocus: true } },
        });

        expect(page.activeZoneId()).toBe("autofocus-test");
    });
});
