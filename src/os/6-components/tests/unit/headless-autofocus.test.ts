/**
 * @spec docs/1-project/headless-zone-registry/spec.md#T2
 *
 * T2: FocusGroup autoFocus를 getItems() headless 경로로 전환
 *
 * 핵심 증명: autoFocus=true + getItems가 있으면
 * DOM querySelector 없이 render-time에 첫 번째 아이템을 포커스해야 한다.
 *
 * 현재(Before): autoFocus는 useEffect + containerRef.current + querySelector.
 * renderToString에서 useEffect가 실행되지 않으므로 headless에서 autoFocus 불가.
 *
 * 목표(After): getItems()가 있으면 render-time(useMemo)에서 OS_FOCUS dispatch.
 * DOM fallback은 getItems 없을 때만.
 *
 * Tier 1: OS 커널 아키텍처 테스트
 */

import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { FocusGroup } from "@os/6-components/base/FocusGroup";
import { os, initialAppState } from "@os/kernel";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const ZONE_ID = "autofocus-test-zone";

function cleanup() {
    for (const key of [...ZoneRegistry.keys()]) {
        ZoneRegistry.unregister(key);
    }
    // Reset OS state to prevent cross-test leakage
    os.setState(() => ({ ...initialAppState }));
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe("T2: FocusGroup autoFocus headless pathway", () => {
    afterEach(cleanup);

    // Scenario T2-1: getItems() 경로로 autoFocus
    it("T2-1: autoFocus dispatches OS_FOCUS with first item from getItems()", () => {
        const getItems = () => ["item-a", "item-b", "item-c"];

        renderToString(
            createElement(FocusGroup, {
                id: ZONE_ID,
                role: "dialog",
                project: { autoFocus: true },
                getItems,
                children: null,
            }),
        );

        // After render, the zone should be active with first item focused
        const state = os.getState();
        const zoneState = state.os.focus.zones[ZONE_ID];

        expect(state.os.focus.activeZoneId).toBe(ZONE_ID);
        expect(zoneState?.focusedItemId).toBe("item-a");
    });

    // Scenario T2-3: getItems가 빈 배열이면 zone만 활성화
    it("T2-3: autoFocus with empty getItems activates zone only (itemId=null)", () => {
        const getItems = () => [] as string[];

        renderToString(
            createElement(FocusGroup, {
                id: ZONE_ID,
                role: "dialog",
                project: { autoFocus: true },
                getItems,
                children: null,
            }),
        );

        const state = os.getState();
        expect(state.os.focus.activeZoneId).toBe(ZONE_ID);
        // focusedItemId should be null (no items to focus)
        const zoneState = state.os.focus.zones[ZONE_ID];
        expect(zoneState?.focusedItemId).toBeNull();
    });

    // Scenario T2-4: headless에서 autoFocus 동작 (activeZoneId 설정)
    it("T2-4: headless autoFocus sets activeZoneId", () => {
        const getItems = () => ["x"];

        renderToString(
            createElement(FocusGroup, {
                id: ZONE_ID,
                role: "dialog",
                project: { autoFocus: true },
                getItems,
                children: null,
            }),
        );

        expect(os.getState().os.focus.activeZoneId).toBe(ZONE_ID);
    });
});
