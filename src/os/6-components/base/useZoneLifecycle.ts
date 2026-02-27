/**
 * useZoneLifecycle — Zone registration + lifecycle management.
 *
 * Extracted from FocusGroup to eliminate callback relay duplication.
 * Both Zone (primary) and standalone FocusGroup call this hook.
 *
 * Responsibilities:
 *   1. Register ZoneEntry in ZoneRegistry (useMemo, render-safe)
 *   2. Dispatch OS_ZONE_INIT (useLayoutEffect, commit-phase)
 *   3. Bind DOM element → auto-creates getItems/getLabels (useLayoutEffect)
 *   4. AutoFocus first item (useLayoutEffect)
 *   5. Focus Stack push/pop for dialogs (useLayoutEffect)
 *   6. StrictMode re-register safety (useLayoutEffect)
 *   7. Cleanup: unregister on unmount
 */

import type { BaseCommand } from "@kernel";
import type { ZoneCallback, ZoneEntry } from "../../2-contexts/zoneRegistry.ts";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry.ts";
import {
    OS_FOCUS,
    OS_STACK_POP,
    OS_STACK_PUSH,
    OS_ZONE_INIT,
} from "../../3-commands/focus";
import { os } from "../../kernel.ts";
import type { ZoneRole } from "../../registries/roleRegistry.ts";
import type { FocusGroupConfig } from "../../schemas";
import { useLayoutEffect, useMemo, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// Zone Callbacks — all entry-level callbacks collected as one bag
// OCP: add a field here → automatically flows to ZoneEntry.
// ═══════════════════════════════════════════════════════════════════

export interface ZoneCallbacks {
    onAction?: ZoneCallback;
    onSelect?: ZoneCallback;
    onCheck?: ZoneCallback;
    onDelete?: ZoneCallback;
    onMoveUp?: ZoneCallback;
    onMoveDown?: ZoneCallback;
    onCopy?: ZoneCallback;
    onCut?: ZoneCallback;
    onPaste?: ZoneCallback;
    onUndo?: BaseCommand;
    onRedo?: BaseCommand;
    onDismiss?: BaseCommand;
    itemFilter?: (items: string[]) => string[];
    getItems?: () => string[];
    getExpandableItems?: () => Set<string>;
    getTreeLevels?: () => Map<string, number>;
    onReorder?: (info: {
        itemId: string;
        overItemId: string;
        position: "before" | "after";
    }) => BaseCommand | BaseCommand[];
}

// ═══════════════════════════════════════════════════════════════════
// Entry Builder — single source of truth for ZoneEntry construction.
// OCP-safe: new ZoneCallbacks fields flow through spread automatically.
// ═══════════════════════════════════════════════════════════════════

function buildEntry(
    config: FocusGroupConfig,
    role: ZoneRole | undefined,
    parentId: string | null,
    callbacks: ZoneCallbacks,
    existing?: ZoneEntry,
): ZoneEntry {
    // Strip undefined values from callbacks so they don't overwrite existing bindings
    const defined: Partial<ZoneCallbacks> = {};
    for (const [k, v] of Object.entries(callbacks)) {
        if (v !== undefined) (defined as Record<string, unknown>)[k] = v;
    }

    const entry: ZoneEntry = {
        config,
        element: null,
        parentId,
        ...defined,
        ...(role !== undefined ? { role } : {}),
    };

    // Preserve DOM bindings from bindElement (may have been set in previous lifecycle)
    if (existing?.element) entry.element = existing.element;
    if (!callbacks.getItems && existing?.getItems)
        entry.getItems = existing.getItems;
    if (!entry.getLabels && existing?.getLabels)
        entry.getLabels = existing.getLabels;

    return entry;
}

// ═══════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════

export function useZoneLifecycle(
    zoneId: string,
    config: FocusGroupConfig,
    role: ZoneRole | undefined,
    parentId: string | null,
    containerRef: React.RefObject<HTMLElement | null>,
    callbacks: ZoneCallbacks,
): void {
    // --- Stable ref for callbacks (avoid deps churn) ---
    const callbacksRef = useRef(callbacks);
    callbacksRef.current = callbacks;

    // --- Phase 1: Logical registration (render-time, headless-safe) ---
    useMemo(() => {
        const existing = ZoneRegistry.get(zoneId);
        ZoneRegistry.register(
            zoneId,
            buildEntry(config, role, parentId, callbacksRef.current, existing),
        );
    }, [zoneId, config, role, parentId]);

    // --- Phase 2: Commit-phase (dispatch + DOM binding) ---
    useLayoutEffect(() => {
        // 1. Init kernel state (idempotent)
        os.dispatch(OS_ZONE_INIT(zoneId));

        // 2. StrictMode safety — re-register if cleanup wiped the entry
        if (!ZoneRegistry.has(zoneId)) {
            ZoneRegistry.register(
                zoneId,
                buildEntry(config, role, parentId, callbacksRef.current),
            );
        }

        // 3. Bind DOM element → auto-creates getItems/getLabels if not explicit
        if (containerRef.current) {
            ZoneRegistry.bindElement(zoneId, containerRef.current);
        }

        // 4. AutoFocus
        if (config.project.autoFocus) {
            const items = ZoneRegistry.resolveItems(zoneId);
            const firstItemId = items[0] ?? null;
            os.dispatch(OS_FOCUS({ zoneId, itemId: firstItemId }));
        }

        return () => {
            ZoneRegistry.unregister(zoneId);
        };
    }, [zoneId, config, role, parentId]);

    // --- Focus Stack (dialog/alertdialog) ---
    useLayoutEffect(() => {
        if (!config.project.autoFocus) return;
        os.dispatch(OS_STACK_PUSH());
        return () => {
            os.dispatch(OS_STACK_POP());
        };
    }, [config.project.autoFocus]);
}
