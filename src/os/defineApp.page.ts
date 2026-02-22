/**
 * defineApp — AppPage factory
 *
 * Creates a Playwright Page-isomorphic headless integration test interface.
 * Uses the production kernel with preview mode for state isolation.
 * No OS duplication — wraps shared headless interaction functions.
 *
 * "Same test code, different runtime."
 */

import { os, type AppState, initialAppState } from "@os/kernel";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { DEFAULT_CONFIG, type FocusGroupConfig } from "@os/schemas/focus/config/FocusGroupConfig";
import { Keybindings } from "@os/keymaps/keybindings";
import { ensureZone } from "@os/state/utils";
import { produce } from "immer";
import { createElement, type FC } from "react";
import { renderToString } from "react-dom/server";

import {
    type ItemAttrs,
    simulateKeyPress,
    simulateClick,
    computeAttrs,
    readActiveZoneId,
    readFocusedItemId,
    readSelection,
} from "./headless";

// Ensure OS defaults are registered
import "@os/keymaps/osDefaults";

import type { AppPage, ZoneBindings, KeybindingEntry } from "./defineApp.types";
import type { ZoneRole } from "./registries/roleRegistry";
import type { BaseCommand } from "@kernel/core/tokens";

// ═══════════════════════════════════════════════════════════════════
// Zone Binding Entry — collected by defineApp.ts at zone.bind() time
// ═══════════════════════════════════════════════════════════════════

export interface ZoneBindingEntry {
    role: ZoneRole;
    bindings: ZoneBindings;
    keybindings?: KeybindingEntry<any>[];
}

// ═══════════════════════════════════════════════════════════════════
// createAppPage — Preview-based, ~50 lines of logic
// ═══════════════════════════════════════════════════════════════════

export function createAppPage<S>(
    appId: string,
    zoneBindingEntries: Map<string, ZoneBindingEntry>,
    Component?: FC,
): AppPage<S> {
    // ── Mock items for headless context ──
    const mockItems: string[] = [];
    /** Track keybinding unregister so cleanup() works correctly */
    let unregisterKeybindings: (() => void) | null = null;

    // Override DOM contexts for headless (no DOM, no React)
    os.defineContext("dom-items", () => {
        const zoneId = os.getState().os.focus.activeZoneId;
        const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;
        return entry?.itemFilter ? entry.itemFilter(mockItems) : mockItems;
    });
    os.defineContext("dom-rects", () => new Map<string, DOMRect>());
    os.defineContext("dom-expandable-items", () => new Set<string>());
    os.defineContext("dom-tree-levels", () => new Map<string, number>());
    os.defineContext("zone-config", () => {
        const zoneId = os.getState().os.focus.activeZoneId;
        const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;
        return entry?.config ?? DEFAULT_CONFIG;
    });
    os.defineContext("dom-zone-order", () => {
        const state = os.getState();
        const entries: Array<import("./2-contexts").ZoneOrderEntry> = [];
        for (const zoneId of ZoneRegistry.keys()) {
            const zoneEntry = ZoneRegistry.get(zoneId);
            if (!zoneEntry) continue;
            const zoneState = state.os.focus.zones[zoneId];
            const entry = zoneEntry.config?.navigate?.entry ?? "first";
            // In headless, items come from mockItems (only for active zone)
            // For non-active zones, use lastFocusedId as fallback
            const isActive = state.os.focus.activeZoneId === zoneId;
            const items = isActive ? mockItems : [];
            entries.push({
                zoneId,
                firstItemId: items[0] ?? zoneState?.lastFocusedId ?? null,
                lastItemId: items[items.length - 1] ?? zoneState?.lastFocusedId ?? null,
                entry,
                selectedItemId: zoneState?.selection?.[0] ?? null,
                lastFocusedId: zoneState?.lastFocusedId ?? null,
            });
        }
        return entries;
    });

    // ── Enter preview sandbox ──
    os.enterPreview({
        ...os.getState(),
        os: { ...initialAppState.os },
    });

    // ── goto ──
    function goto(zoneName: string, opts?: {
        items?: string[];
        focusedItemId?: string | null;
        config?: Partial<FocusGroupConfig>;
    }) {
        // Use zoneName directly — matches FocusGroup's id in React.
        // Preview sandbox is isolated per-app, so prefix is unnecessary.

        // Set mock items
        if (opts?.items) {
            mockItems.length = 0;
            mockItems.push(...opts.items);
        }

        // Register zone in ZoneRegistry with app callbacks
        const bindingEntry = zoneBindingEntries.get(zoneName);
        if (bindingEntry) {
            const { bindings } = bindingEntry;
            ZoneRegistry.register(zoneName, {
                role: bindingEntry.role,
                config: opts?.config
                    ? { ...DEFAULT_CONFIG, ...opts.config }
                    : DEFAULT_CONFIG,
                element: null as unknown as HTMLElement,
                parentId: null,
                ...(bindings.onAction ? { onAction: bindings.onAction } : {}),
                ...(bindings.onCheck ? { onCheck: bindings.onCheck } : {}),
                ...(bindings.onDelete ? { onDelete: bindings.onDelete } : {}),
                ...(bindings.onCopy ? { onCopy: bindings.onCopy } : {}),
                ...(bindings.onCut ? { onCut: bindings.onCut } : {}),
                ...(bindings.onPaste ? { onPaste: bindings.onPaste } : {}),
                ...(bindings.onMoveUp ? { onMoveUp: bindings.onMoveUp } : {}),
                ...(bindings.onMoveDown ? { onMoveDown: bindings.onMoveDown } : {}),
                ...(bindings.onUndo ? { onUndo: bindings.onUndo } : {}),
                ...(bindings.onRedo ? { onRedo: bindings.onRedo } : {}),
                ...(bindings.onSelect ? { onSelect: bindings.onSelect } : {}),
                ...(bindings.itemFilter ? { itemFilter: bindings.itemFilter } : {}),
            });
        }

        // Register zone keybindings in the global Keybindings registry
        // (mirrors what FocusGroup.tsx does at mount time in the browser)
        if (unregisterKeybindings) unregisterKeybindings();
        const keybindings = bindingEntry?.keybindings ?? [];
        if (keybindings.length > 0) {
            unregisterKeybindings = Keybindings.registerAll(
                keybindings.map((kb) => ({
                    key: kb.key,
                    command: kb.command,
                    when: "navigating" as const,
                })),
            );
        }

        // Set active zone + focused item via setState on preview layer
        const focusedId = opts?.focusedItemId ?? null;
        os.setState((s: AppState) =>
            produce(s, (draft) => {
                draft.os.focus.activeZoneId = zoneName;
                const z = ensureZone(draft.os, zoneName);
                z.focusedItemId = focusedId;
                if (focusedId) z.lastFocusedId = focusedId;
            }),
        );
    }

    // ── Return AppPage ──
    return {
        keyboard: {
            press(key: string) { simulateKeyPress(os, key); },
        },

        click(itemId: string, opts?) { simulateClick(os, itemId, opts); },

        attrs(itemId: string, zoneId?: string): ItemAttrs {
            return computeAttrs(os, itemId, zoneId);
        },

        goto,

        focusedItemId(zoneId?: string) { return readFocusedItemId(os, zoneId); },
        selection(zoneId?: string) { return readSelection(os, zoneId); },
        activeZoneId() { return readActiveZoneId(os); },

        get state() {
            return os.getState().apps[appId] as S;
        },

        dispatch(command: BaseCommand): boolean {
            os.dispatch(command);
            return true;
        },

        reset() {
            // Clear and re-enter preview with fresh state
            os.exitPreview();
            os.enterPreview({
                ...os.getState(),
                os: { ...initialAppState.os },
            });
            mockItems.length = 0;
        },

        cleanup() {
            if (unregisterKeybindings) {
                unregisterKeybindings();
                unregisterKeybindings = null;
            }
            const zId = readActiveZoneId(os);
            if (zId) ZoneRegistry.unregister(zId);
            os.exitPreview();
        },

        // ── Projection Checkpoint ──────────────────────────────────

        query(search: string): boolean {
            if (!Component) {
                throw new Error(
                    "query() requires a Component. Use createPage(MyComponent) to enable projection checkpoint.",
                );
            }
            const html = renderToString(createElement(Component));
            return html.includes(search);
        },

        html(): string {
            if (!Component) {
                throw new Error(
                    "html() requires a Component. Use createPage(MyComponent) to enable projection checkpoint.",
                );
            }
            return renderToString(createElement(Component));
        },
    };
}

export type { ItemAttrs };

import type { AppHandle } from "./defineApp.types";

/**
 * Create a Playwright Page-isomorphic headless integration test interface.
 *
 * Usage:
 *   import { createPage } from "@os/defineApp.page";
 *   const page = createPage(TodoApp);              // headless
 *   const page = createPage(TodoApp, ListView);    // headless + projection
 *
 * createPage is an OS capability — it reads app data (appId, zone bindings)
 * from the AppHandle and sets up the headless test environment.
 */
export function createPage<S>(
    app: AppHandle<S>,
    Component?: FC,
): AppPage<S> {
    return createAppPage<S>(app.__appId, app.__zoneBindings, Component);
}
