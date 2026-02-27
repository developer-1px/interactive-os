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
    // ZoneRegistry.register is a pure Map.set — no re-render triggered.
    // CRITICAL: Preserve DOM bindings from bindElement (useLayoutEffect).
    useMemo(() => {
        const existing = ZoneRegistry.get(zoneId);
        const cb = callbacksRef.current;

        const entry: ZoneEntry = {
            config,
            element: null,
            parentId,
        };
        if (role !== undefined) entry.role = role;
        if (cb.onDismiss !== undefined) entry.onDismiss = cb.onDismiss;
        if (cb.onAction !== undefined) entry.onAction = cb.onAction;
        if (cb.onSelect !== undefined) entry.onSelect = cb.onSelect;
        if (cb.onCheck !== undefined) entry.onCheck = cb.onCheck;
        if (cb.onDelete !== undefined) entry.onDelete = cb.onDelete;
        if (cb.onMoveUp !== undefined) entry.onMoveUp = cb.onMoveUp;
        if (cb.onMoveDown !== undefined) entry.onMoveDown = cb.onMoveDown;
        if (cb.onCopy !== undefined) entry.onCopy = cb.onCopy;
        if (cb.onCut !== undefined) entry.onCut = cb.onCut;
        if (cb.onPaste !== undefined) entry.onPaste = cb.onPaste;
        if (cb.onUndo !== undefined) entry.onUndo = cb.onUndo;
        if (cb.onRedo !== undefined) entry.onRedo = cb.onRedo;
        if (cb.itemFilter !== undefined) entry.itemFilter = cb.itemFilter;
        if (cb.getItems !== undefined) entry.getItems = cb.getItems;
        if (cb.getExpandableItems !== undefined)
            entry.getExpandableItems = cb.getExpandableItems;
        if (cb.getTreeLevels !== undefined)
            entry.getTreeLevels = cb.getTreeLevels;
        if (cb.onReorder !== undefined) entry.onReorder = cb.onReorder;

        // Preserve DOM bindings from bindElement
        if (existing?.element) entry.element = existing.element;
        if (!cb.getItems && existing?.getItems) entry.getItems = existing.getItems;
        if (!entry.getLabels && existing?.getLabels)
            entry.getLabels = existing.getLabels;

        ZoneRegistry.register(zoneId, entry);
    }, [zoneId, config, role, parentId]);

    // --- Phase 2: Commit-phase (dispatch + DOM binding) ---
    useLayoutEffect(() => {
        // 1. Init kernel state (idempotent)
        os.dispatch(OS_ZONE_INIT(zoneId));

        // 2. Ensure entry exists (StrictMode cleanup→remount safety)
        if (!ZoneRegistry.has(zoneId)) {
            const cb = callbacksRef.current;
            const entry: ZoneEntry = { config, element: null, parentId };
            if (role !== undefined) entry.role = role;
            if (cb.onDismiss !== undefined) entry.onDismiss = cb.onDismiss;
            if (cb.onAction !== undefined) entry.onAction = cb.onAction;
            if (cb.onSelect !== undefined) entry.onSelect = cb.onSelect;
            if (cb.onCheck !== undefined) entry.onCheck = cb.onCheck;
            if (cb.onDelete !== undefined) entry.onDelete = cb.onDelete;
            if (cb.onMoveUp !== undefined) entry.onMoveUp = cb.onMoveUp;
            if (cb.onMoveDown !== undefined) entry.onMoveDown = cb.onMoveDown;
            if (cb.onCopy !== undefined) entry.onCopy = cb.onCopy;
            if (cb.onCut !== undefined) entry.onCut = cb.onCut;
            if (cb.onPaste !== undefined) entry.onPaste = cb.onPaste;
            if (cb.onUndo !== undefined) entry.onUndo = cb.onUndo;
            if (cb.onRedo !== undefined) entry.onRedo = cb.onRedo;
            if (cb.itemFilter !== undefined) entry.itemFilter = cb.itemFilter;
            if (cb.getItems !== undefined) entry.getItems = cb.getItems;
            if (cb.getExpandableItems !== undefined)
                entry.getExpandableItems = cb.getExpandableItems;
            if (cb.getTreeLevels !== undefined)
                entry.getTreeLevels = cb.getTreeLevels;
            if (cb.onReorder !== undefined) entry.onReorder = cb.onReorder;
            ZoneRegistry.register(zoneId, entry);
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
