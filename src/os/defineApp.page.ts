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
import { ensureZone } from "@os/state/utils";
import { produce } from "immer";

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
    keybindings: KeybindingEntry<any>[];
}

// ═══════════════════════════════════════════════════════════════════
// createAppPage — Preview-based, ~50 lines of logic
// ═══════════════════════════════════════════════════════════════════

export function createAppPage<S>(
    appId: string,
    zoneBindingEntries: Map<string, ZoneBindingEntry>,
): AppPage<S> {
    // ── Mock items for headless context ──
    const mockItems: string[] = [];

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
    os.defineContext("dom-zone-order", () => []);

    // ── Enter preview sandbox ──
    os.setPreview({
        ...os.getState(),
        os: { ...initialAppState.os },
    });

    // ── goto ──
    function goto(zoneName: string, opts?: {
        items?: string[];
        focusedItemId?: string | null;
        config?: Partial<FocusGroupConfig>;
    }) {
        const fullZoneId = `${appId}:${zoneName}`;

        // Set mock items
        if (opts?.items) {
            mockItems.length = 0;
            mockItems.push(...opts.items);
        }

        // Register zone in ZoneRegistry with app callbacks
        const bindingEntry = zoneBindingEntries.get(zoneName);
        if (bindingEntry) {
            const { bindings } = bindingEntry;
            ZoneRegistry.register(fullZoneId, {
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

        // Set active zone + focused item via setState on preview layer
        const focusedId = opts?.focusedItemId ?? null;
        os.setState((s: AppState) =>
            produce(s, (draft) => {
                draft.os.focus.activeZoneId = fullZoneId;
                const z = ensureZone(draft.os, fullZoneId);
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
            os.clearPreview();
            os.setPreview({
                ...os.getState(),
                os: { ...initialAppState.os },
            });
            mockItems.length = 0;
        },

        cleanup() {
            const zId = readActiveZoneId(os);
            if (zId) ZoneRegistry.unregister(zId);
            os.clearPreview();
        },
    };
}

export type { ItemAttrs };
