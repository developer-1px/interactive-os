/**
 * OS Headless Interaction — Shared utility functions
 *
 * Pure functions that simulate user interactions (keyboard, mouse)
 * and compute ARIA attributes without DOM.
 *
 * Used by:
 *   - createOsPage (OS-only integration tests)
 *   - defineApp.page.ts (Full Stack TestPage)
 *   - withRecording (TestBot replay engine)
 *
 * All functions are pure — they read kernel state and ZoneRegistry,
 * then call resolveKeyboard/resolveMouse → dispatch.
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import {
    type KeyboardInput,
    resolveKeyboard,
} from "@os/1-listeners/keyboard/resolveKeyboard";
import {
    type MouseInput,
    resolveMouse,
} from "@os/1-listeners/mouse/resolveMouse";
import {
    getChildRole,
    isCheckedRole,
    isExpandableRole,
} from "@os/registries/roleRegistry";
import type { AppState } from "@os/kernel";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface ItemAttrs {
    role: string | undefined;
    tabIndex: number;
    "aria-selected"?: boolean;
    "aria-checked"?: boolean;
    "aria-expanded"?: boolean;
    "aria-disabled"?: boolean;
    "data-focused"?: true | undefined;
}

/** Minimal kernel interface needed by headless interaction functions */
export interface HeadlessKernel {
    getState(): AppState;
    dispatch(cmd: any, opts?: any): void;
}

// ═══════════════════════════════════════════════════════════════════
// State Readers
// ═══════════════════════════════════════════════════════════════════

export function readActiveZoneId(kernel: HeadlessKernel): string | null {
    return kernel.getState().os.focus.activeZoneId;
}

function readZone(kernel: HeadlessKernel, zoneId?: string) {
    const id = zoneId ?? readActiveZoneId(kernel);
    return id ? kernel.getState().os.focus.zones[id] : undefined;
}

export function readFocusedItemId(kernel: HeadlessKernel, zoneId?: string): string | null {
    return readZone(kernel, zoneId)?.focusedItemId ?? null;
}

export function readSelection(kernel: HeadlessKernel, zoneId?: string): string[] {
    return readZone(kernel, zoneId)?.selection ?? [];
}

// ═══════════════════════════════════════════════════════════════════
// simulateKeyPress
// ═══════════════════════════════════════════════════════════════════

export function simulateKeyPress(kernel: HeadlessKernel, key: string): void {
    const activeZoneId = readActiveZoneId(kernel);
    const zone = activeZoneId
        ? kernel.getState().os.focus.zones[activeZoneId]
        : undefined;
    const entry = activeZoneId ? ZoneRegistry.get(activeZoneId) : undefined;
    const childRole = entry?.role ? getChildRole(entry.role) : undefined;

    const input: KeyboardInput = {
        canonicalKey: key,
        key,
        isEditing: false,
        isFieldActive: false,
        isComposing: false,
        isDefaultPrevented: false,
        isInspector: false,
        isCombobox: false,
        focusedItemRole: childRole ?? null,
        focusedItemId: zone?.focusedItemId ?? null,
        activeZoneHasCheck: !!entry?.onCheck,
        activeZoneFocusedItemId: zone?.focusedItemId ?? null,
        elementId: zone?.focusedItemId ?? undefined,
        cursor: zone?.focusedItemId
            ? {
                focusId: zone.focusedItemId,
                selection: zone.selection ?? [],
                anchor: zone.selectionAnchor ?? null,
            }
            : null,
    };

    const result = resolveKeyboard(input);
    dispatchResult(kernel, result);
}

// ═══════════════════════════════════════════════════════════════════
// simulateClick
// ═══════════════════════════════════════════════════════════════════

export function simulateClick(
    kernel: HeadlessKernel,
    itemId: string,
    opts?: { shift?: boolean; meta?: boolean; ctrl?: boolean; zoneId?: string },
): void {
    const zoneId = opts?.zoneId ?? readActiveZoneId(kernel);
    if (!zoneId) return;

    const entry = ZoneRegistry.get(zoneId);
    const childRole = entry?.role ? getChildRole(entry.role) : undefined;
    const expandable = childRole ? isExpandableRole(childRole) : false;

    const input: MouseInput = {
        targetItemId: itemId,
        targetGroupId: zoneId,
        shiftKey: opts?.shift ?? false,
        metaKey: opts?.meta ?? false,
        ctrlKey: opts?.ctrl ?? false,
        altKey: false,
        isLabel: false,
        labelTargetItemId: null,
        labelTargetGroupId: null,
        hasAriaExpanded: expandable,
        itemRole: childRole ?? null,
    };

    const result = resolveMouse(input);
    dispatchResult(kernel, result);
}

// ═══════════════════════════════════════════════════════════════════
// computeAttrs
// ═══════════════════════════════════════════════════════════════════

export function computeAttrs(
    kernel: HeadlessKernel,
    itemId: string,
    zoneId?: string,
): ItemAttrs {
    const id = zoneId ?? readActiveZoneId(kernel);
    if (!id) {
        return { role: undefined, tabIndex: -1 };
    }

    const s = kernel.getState();
    const z = s.os.focus.zones[id];
    const entry = ZoneRegistry.get(id);
    const childRole = entry?.role ? getChildRole(entry.role) : undefined;
    const expandable = childRole ? isExpandableRole(childRole) : false;
    const useChecked = childRole ? isCheckedRole(childRole) : false;

    const isFocused = z?.focusedItemId === itemId;
    const isActiveZone = s.os.focus.activeZoneId === id;
    const isSelected = z?.selection.includes(itemId) ?? false;
    const isExpanded = z?.expandedItems.includes(itemId) ?? false;
    const isDisabled = ZoneRegistry.isDisabled(id, itemId);

    const result: ItemAttrs = {
        role: childRole,
        tabIndex: isFocused ? 0 : -1,
        "data-focused": (isFocused && isActiveZone) || undefined,
    };

    if (useChecked) {
        result["aria-checked"] = isSelected;
    } else {
        result["aria-selected"] = isSelected;
    }

    if (expandable) {
        result["aria-expanded"] = isExpanded;
    }

    if (isDisabled) {
        result["aria-disabled"] = true;
    }

    return result;
}

// ═══════════════════════════════════════════════════════════════════
// Dispatch Helper
// ═══════════════════════════════════════════════════════════════════

function dispatchResult(
    kernel: HeadlessKernel,
    result: ReturnType<typeof resolveKeyboard>,
): void {
    if (result.commands.length > 0) {
        for (const cmd of result.commands) {
            const opts = result.meta ? { meta: { input: result.meta } } : undefined;
            kernel.dispatch(cmd, opts);
        }
    }
}
