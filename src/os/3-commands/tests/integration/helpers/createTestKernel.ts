/**
 * createTestKernel — Shared headless kernel factory for integration tests.
 *
 * Creates an isolated kernel instance with:
 *   - Real commands: FOCUS, SYNC_FOCUS, SELECT, NAVIGATE, TAB
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
import { resolveTab } from "../../../tab/resolveTab";
import { resolveNavigate } from "../../../navigate/resolve";
import type { FocusGroupConfig } from "@os/schemas/focus/config/FocusGroupConfig";
import { DEFAULT_CONFIG } from "@os/schemas/focus/config/FocusGroupConfig";

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

    // ─── FOCUS command ───
    const FOCUS = kernel.defineCommand(
        "OS_FOCUS",
        (ctx) => (payload: { zoneId: string; itemId: string | null }) => {
            const { zoneId, itemId } = payload;
            return {
                state: produce(ctx.state, (draft) => {
                    const zone = ensureZone(draft.os, zoneId);
                    zone.focusedItemId = itemId;
                    draft.os.focus.activeZoneId = zoneId;
                    if (itemId) {
                        zone.lastFocusedId = itemId;
                        zone.recoveryTargetId = null;
                    }
                }),
                focus: itemId,
            };
        },
    );

    // ─── SYNC_FOCUS command ───
    const SYNC_FOCUS = kernel.defineCommand(
        "OS_SYNC_FOCUS",
        (ctx) => (payload: { id: string; zoneId: string }) => ({
            state: produce(ctx.state, (draft) => {
                const z = ensureZone(draft.os, payload.zoneId);
                z.focusedItemId = payload.id;
                z.lastFocusedId = payload.id;
                draft.os.focus.activeZoneId = payload.zoneId;
            }),
        }),
    );

    // ─── SELECT command ───
    const SELECT = kernel.defineCommand(
        "OS_SELECT",
        [DOM_ITEMS, ZONE_CONFIG],
        (ctx) =>
            (payload: {
                targetId?: string;
                mode?: "single" | "replace" | "toggle" | "range";
            }) => {
                const { activeZoneId } = ctx.state.os.focus;
                if (!activeZoneId) return;

                const zone = ctx.state.os.focus.zones[activeZoneId];
                if (!zone) return;

                const targetId = payload.targetId ?? zone.focusedItemId;
                if (!targetId) return;

                const items: string[] = ctx.inject(DOM_ITEMS);
                const mode = payload.mode ?? "single";

                return {
                    state: produce(ctx.state, (draft) => {
                        const z = ensureZone(draft.os, activeZoneId);
                        switch (mode) {
                            case "single":
                            case "replace":
                                z.selection = [targetId];
                                z.selectionAnchor = targetId;
                                break;
                            case "toggle":
                                if (z.selection.includes(targetId)) {
                                    z.selection = z.selection.filter(
                                        (id: string) => id !== targetId,
                                    );
                                } else {
                                    z.selection.push(targetId);
                                    z.selectionAnchor = targetId;
                                }
                                break;
                            case "range": {
                                const anchor = z.selectionAnchor ?? targetId;
                                const anchorIdx = items.indexOf(anchor);
                                const targetIdx = items.indexOf(targetId);
                                if (anchorIdx !== -1 && targetIdx !== -1) {
                                    const start = Math.min(anchorIdx, targetIdx);
                                    const end = Math.max(anchorIdx, targetIdx);
                                    z.selection = items.slice(start, end + 1);
                                    z.selectionAnchor = anchor;
                                }
                                break;
                            }
                        }
                    }) as typeof ctx.state,
                };
            },
    );

    // ─── NAVIGATE command ───
    const NAVIGATE = kernel.defineCommand(
        "OS_NAVIGATE",
        [DOM_ITEMS, DOM_RECTS, ZONE_CONFIG],
        (ctx) =>
            (payload: {
                direction: "up" | "down" | "left" | "right" | "home" | "end";
                select?: "range" | "toggle";
            }) => {
                const { activeZoneId } = ctx.state.os.focus;
                if (!activeZoneId) return;

                const zone = ctx.state.os.focus.zones[activeZoneId];
                if (!zone) return;

                const items: string[] = ctx.inject(DOM_ITEMS);
                const itemRects: Map<string, DOMRect> = ctx.inject(DOM_RECTS);
                const config = ctx.inject(ZONE_CONFIG);

                if (items.length === 0) return;

                const navResult = resolveNavigate(
                    zone.focusedItemId,
                    payload.direction,
                    items,
                    config.navigate,
                    { stickyX: zone.stickyX, stickyY: zone.stickyY, itemRects },
                );

                return {
                    state: produce(ctx.state, (draft) => {
                        const z = ensureZone(draft.os, activeZoneId);
                        z.focusedItemId = navResult.targetId;
                        z.stickyX = navResult.stickyX;
                        z.stickyY = navResult.stickyY;
                        z.editingItemId = null;

                        if (navResult.targetId) {
                            z.lastFocusedId = navResult.targetId;
                            z.recoveryTargetId = null;
                            const idx = items.indexOf(navResult.targetId);
                            if (idx !== -1) {
                                z.recoveryTargetId =
                                    items[idx + 1] ?? items[idx - 1] ?? null;
                            }
                        }

                        // Shift+arrow selection
                        if (payload.select === "range" && navResult.targetId) {
                            const anchor =
                                z.selectionAnchor ||
                                zone.focusedItemId ||
                                navResult.targetId;
                            const anchorIdx = items.indexOf(anchor);
                            const targetIdx = items.indexOf(navResult.targetId);
                            if (anchorIdx !== -1 && targetIdx !== -1) {
                                const start = Math.min(anchorIdx, targetIdx);
                                const end = Math.max(anchorIdx, targetIdx);
                                z.selection = items.slice(start, end + 1);
                                z.selectionAnchor = anchor;
                            }
                        }

                        // followFocus
                        if (
                            !payload.select &&
                            config.select.followFocus &&
                            config.select.mode !== "none" &&
                            navResult.targetId
                        ) {
                            z.selection = [navResult.targetId];
                            z.selectionAnchor = navResult.targetId;
                        }
                    }) as typeof ctx.state,
                    focus: config.project.virtualFocus ? undefined : navResult.targetId,
                    scroll: navResult.targetId,
                };
            },
    );

    // ─── TAB command ───
    const TAB = kernel.defineCommand(
        "OS_TAB",
        [DOM_ITEMS, ZONE_CONFIG, DOM_ZONE_ORDER],
        (ctx) => (payload: { direction?: "forward" | "backward" }) => {
            const { activeZoneId } = ctx.state.os.focus;
            if (!activeZoneId) return;

            const zone = ctx.state.os.focus.zones[activeZoneId];
            if (!zone) return;

            const items: string[] = ctx.inject(DOM_ITEMS);
            const config = ctx.inject(ZONE_CONFIG);
            const zoneOrder = ctx.inject(DOM_ZONE_ORDER);
            const direction = payload.direction ?? "forward";

            const result = resolveTab(
                zone.focusedItemId,
                items,
                config.tab.behavior,
                direction,
                activeZoneId,
                zoneOrder,
            );

            if (!result) return;

            if (result.type === "within") {
                return {
                    state: produce(ctx.state, (draft) => {
                        const z = ensureZone(draft.os, activeZoneId);
                        z.focusedItemId = result.itemId;
                        z.lastFocusedId = result.itemId;
                    }) as typeof ctx.state,
                    focus: result.itemId,
                };
            }

            return {
                state: produce(ctx.state, (draft) => {
                    draft.os.focus.activeZoneId = result.zoneId;
                    const z = ensureZone(draft.os, result.zoneId);
                    z.focusedItemId = result.itemId;
                    z.lastFocusedId = result.itemId;
                }) as typeof ctx.state,
                focus: result.itemId,
            };
        },
    );

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
