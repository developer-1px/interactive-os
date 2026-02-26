/**
 * @spec docs/1-project/headless-item-discovery/spec.md#T1,T2,T3
 *
 * Push-Based Item Discovery:
 * T1: DOM_ITEMS returns items from getItems() without DOM
 * T2: DOM_ZONE_ORDER works without document.querySelectorAll
 * T3: getZoneItems uses getItems() instead of DOM
 *
 * Tier 1: OS 커널 아키텍처 테스트 — DOM 0%
 *
 * Strategy: Register zones with getItems() accessor, element=null.
 * Verify contexts resolve correctly via kernel dispatch + inject.
 */

import { afterEach, describe, expect, it } from "vitest";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import {
    DOM_ITEMS,
    DOM_ZONE_ORDER,
    type ZoneOrderEntry,
} from "@os/2-contexts/index";
import { getZoneItems } from "@os/2-contexts/itemQueries";
import { os, initialAppState } from "@os/kernel";
import { OS_ZONE_INIT } from "@os/3-commands/focus/zoneInit";
import { resolveRole } from "@os/registries/roleRegistry";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const ZONE_A = "push-zone-a";
const ZONE_B = "push-zone-b";

function cleanup() {
    for (const key of [...ZoneRegistry.keys()]) {
        ZoneRegistry.unregister(key);
    }
    os.setState(() => ({ ...initialAppState }));
}

function registerZone(
    zoneId: string,
    opts: {
        getItems?: () => string[];
        itemFilter?: (items: string[]) => string[];
    } = {},
) {
    os.dispatch(OS_ZONE_INIT(zoneId));
    ZoneRegistry.register(zoneId, {
        config: resolveRole("list", {}),
        element: null, // headless — no DOM
        parentId: null,
        ...opts,
    });
}

function setActiveZone(zoneId: string) {
    os.setState((prev) => ({
        ...prev,
        os: {
            ...prev.os,
            focus: {
                ...prev.os.focus,
                activeZoneId: zoneId,
            },
        },
    }));
}

/**
 * Read a context token's value by dispatching a test command that injects it.
 * This exercises the same codepath as production commands.
 */
let capturedInject: Record<string, unknown> = {};
const TEST_READ_CTX = os.defineCommand(
    "TEST_READ_CTX",
    [DOM_ITEMS, DOM_ZONE_ORDER],
    (ctx) => () => {
        capturedInject = {
            "dom-items": ctx.inject(DOM_ITEMS),
            "dom-zone-order": ctx.inject(DOM_ZONE_ORDER),
        };
        return {};
    },
);

// ═══════════════════════════════════════════════════════════════════
// T1: DOM_ITEMS — getItems() primary
// ═══════════════════════════════════════════════════════════════════

describe("T1: DOM_ITEMS push-based (no DOM)", () => {
    afterEach(cleanup);

    it("T1-1: getItems returns items without DOM element", () => {
        registerZone(ZONE_A, { getItems: () => ["a", "b", "c"] });
        setActiveZone(ZONE_A);

        os.dispatch(TEST_READ_CTX());
        const items = capturedInject["dom-items"] as string[];
        expect(items).toEqual(["a", "b", "c"]);
    });

    it("T1-2: getItems + itemFilter applied", () => {
        registerZone(ZONE_A, {
            getItems: () => ["a", "b", "c"],
            itemFilter: (items) => items.filter((i) => i !== "b"),
        });
        setActiveZone(ZONE_A);

        os.dispatch(TEST_READ_CTX());
        const items = capturedInject["dom-items"] as string[];
        expect(items).toEqual(["a", "c"]);
    });

    it("T1-3: no getItems returns empty array", () => {
        registerZone(ZONE_A);
        setActiveZone(ZONE_A);

        os.dispatch(TEST_READ_CTX());
        const items = capturedInject["dom-items"] as string[];
        expect(items).toEqual([]);
    });
});

// ═══════════════════════════════════════════════════════════════════
// T2: DOM_ZONE_ORDER — no document.querySelectorAll
// ═══════════════════════════════════════════════════════════════════

describe("T2: DOM_ZONE_ORDER push-based (no DOM)", () => {
    afterEach(cleanup);

    it("T2-1: zone order from registry with getItems", () => {
        registerZone(ZONE_A, { getItems: () => ["a", "b"] });
        registerZone(ZONE_B, { getItems: () => ["x", "y"] });

        os.dispatch(TEST_READ_CTX());
        const order = capturedInject["dom-zone-order"] as ZoneOrderEntry[];

        const zA = order.find((z) => z.zoneId === ZONE_A);
        const zB = order.find((z) => z.zoneId === ZONE_B);

        expect(zA).toBeDefined();
        expect(zA!.firstItemId).toBe("a");
        expect(zA!.lastItemId).toBe("b");

        expect(zB).toBeDefined();
        expect(zB!.firstItemId).toBe("x");
        expect(zB!.lastItemId).toBe("y");
    });
});

// ═══════════════════════════════════════════════════════════════════
// T3: getZoneItems — getItems() instead of DOM
// ═══════════════════════════════════════════════════════════════════

describe("T3: getZoneItems push-based (no DOM)", () => {
    afterEach(cleanup);

    it("T3-1: returns items from getItems()", () => {
        registerZone(ZONE_A, { getItems: () => ["a", "b", "c"] });

        const items = getZoneItems(ZONE_A);
        expect(items).toEqual(["a", "b", "c"]);
    });

    it("T3-2: no getItems returns empty array", () => {
        registerZone(ZONE_A);

        const items = getZoneItems(ZONE_A);
        expect(items).toEqual([]);
    });
});
