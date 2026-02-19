/**
 * createTestKernel — Shared headless kernel factory for integration tests.
 *
 * Creates an isolated kernel instance with:
 *   - Real commands via kernel.register() (same handlers as production)
 *   - Mock contexts: dom-items, dom-rects, zone-config, dom-zone-order
 *
 * Usage:
 *   const t = createTestKernel();
 *   t.setItems(["a", "b", "c"]);
 *   t.setActiveZone("list", "a");
 *   t.dispatch(t.NAVIGATE({ direction: "down" }));
 *   expect(t.focusedItemId()).toBe("b");
 */

import { createKernel } from "@kernel";
import { produce } from "immer";
import type { AppState } from "@os/kernel";
import { initialOSState } from "@os/state/initial";
import { initialZoneState } from "@os/state/initial";
import { ensureZone } from "@os/state/utils";
import type { FocusGroupConfig } from "@os/schemas/focus/config/FocusGroupConfig";
import { DEFAULT_CONFIG } from "@os/schemas/focus/config/FocusGroupConfig";

// Production commands — registered on test kernel via kernel.register()
import { FOCUS as prodFOCUS } from "../../../focus/focus";
import { SYNC_FOCUS as prodSYNC_FOCUS } from "../../../focus/syncFocus";
import { SELECT as prodSELECT } from "../../../selection/select";
import { NAVIGATE as prodNAVIGATE } from "../../../navigate";
import { TAB as prodTAB } from "../../../tab/tab";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface ZoneOrderEntry {
    zoneId: string;
    firstItemId: string | null;
    lastItemId: string | null;
    entry: "first" | "last" | "restore" | "selected";
    selectedItemId: string | null;
    lastFocusedId: string | null;
}

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export function createTestKernel(overrides?: Partial<AppState>) {
    const initialState: AppState = {
        os: initialOSState,
        apps: {},
        ...overrides,
    };

    const kernel = createKernel<AppState>(initialState);

    // ─── Mutable mock data ───
    const mockItems = { current: [] as string[] };
    const mockRects = { current: new Map<string, DOMRect>() };
    const mockZoneOrder = { current: [] as ZoneOrderEntry[] };
    const mockConfig = { current: { ...DEFAULT_CONFIG } as FocusGroupConfig };

    // ─── No-op effects (suppress "Unknown effect" warnings in headless mode) ───
    kernel.defineEffect("focus", () => { });
    kernel.defineEffect("scroll", () => { });

    // ─── Define contexts with mock providers ───
    const DOM_ITEMS = kernel.defineContext("dom-items", () => mockItems.current);
    const DOM_RECTS = kernel.defineContext(
        "dom-rects",
        () => mockRects.current,
    );
    const ZONE_CONFIG = kernel.defineContext(
        "zone-config",
        () => mockConfig.current,
    );
    const DOM_ZONE_ORDER = kernel.defineContext(
        "dom-zone-order",
        () => mockZoneOrder.current,
    );

    // ─── Register production commands (no duplication) ───
    const FOCUS = kernel.register(prodFOCUS);
    const SYNC_FOCUS = kernel.register(prodSYNC_FOCUS);
    const SELECT = kernel.register(prodSELECT);
    const NAVIGATE = kernel.register(prodNAVIGATE);
    const TAB = kernel.register(prodTAB);

    // ─── Convenience helpers ───

    function setItems(items: string[]) {
        mockItems.current = items;
    }

    function setRects(rects: Map<string, DOMRect>) {
        mockRects.current = rects;
    }

    function setZoneOrder(zones: ZoneOrderEntry[]) {
        mockZoneOrder.current = zones;
    }

    function setConfig(config: Partial<FocusGroupConfig>) {
        mockConfig.current = { ...DEFAULT_CONFIG, ...config };
    }

    function setActiveZone(zoneId: string, focusedItemId: string | null) {
        kernel.setState((s) =>
            produce(s, (draft) => {
                draft.os.focus.activeZoneId = zoneId;
                const z = ensureZone(draft.os, zoneId);
                z.focusedItemId = focusedItemId;
                if (focusedItemId) z.lastFocusedId = focusedItemId;
            }),
        );
    }

    function initZone(zoneId: string) {
        kernel.setState((s) =>
            produce(s, (draft) => {
                if (!draft.os.focus.zones[zoneId]) {
                    draft.os.focus.zones[zoneId] = { ...initialZoneState };
                }
            }),
        );
    }

    // ─── State accessors ───

    const state = () => kernel.getState();
    const osState = () => state().os.focus;
    const activeZoneId = () => osState().activeZoneId;
    const zone = (id?: string) => {
        const zId = id ?? activeZoneId();
        return zId ? osState().zones[zId] : undefined;
    };
    const focusedItemId = (zoneId?: string) => zone(zoneId)?.focusedItemId ?? null;
    const selection = (zoneId?: string) => zone(zoneId)?.selection ?? [];

    return {
        kernel,
        dispatch: kernel.dispatch.bind(kernel),

        // Commands
        FOCUS,
        SYNC_FOCUS,
        SELECT,
        NAVIGATE,
        TAB,

        // Mock setters
        setItems,
        setRects,
        setZoneOrder,
        setConfig,

        // State helpers
        setActiveZone,
        initZone,

        // State accessors
        state,
        activeZoneId,
        zone,
        focusedItemId,
        selection,
    };
}
