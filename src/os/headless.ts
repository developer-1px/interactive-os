/**
 * OS Headless Interaction — Shared utility functions
 *
 * Pure functions that simulate user interactions (keyboard, mouse)
 * and compute ARIA attributes without DOM.
 *
 * Used by:
 *   - createOsPage (OS-only integration tests)
 *   - defineApp.page.ts (Full Stack AppPage)
 *   - withRecording (TestBot replay engine)
 *
 * All functions are pure — they read kernel state and ZoneRegistry,
 * then call resolveKeyboard/resolveMouse → dispatch.
 */

import type { BaseCommand } from "@kernel/core/tokens";
import {
  type KeyboardInput,
  resolveKeyboard,
} from "@os/1-listeners/keyboard/resolveKeyboard";
import {
  type ClickInput,
  resolveClick,
} from "@os/1-listeners/mouse/resolveClick";
import {
  type MouseInput,
  resolveMouse,
} from "@os/1-listeners/mouse/resolveMouse";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OS_COPY, OS_CUT, OS_PASTE } from "@os/3-commands/clipboard/clipboard";
import type { AppState } from "@os/kernel";
import {
  getChildRole,
  isCheckedRole,
  isExpandableRole,
} from "@os/registries/roleRegistry";

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

export function readFocusedItemId(
  kernel: HeadlessKernel,
  zoneId?: string,
): string | null {
  return readZone(kernel, zoneId)?.focusedItemId ?? null;
}

export function readSelection(
  kernel: HeadlessKernel,
  zoneId?: string,
): string[] {
  return readZone(kernel, zoneId)?.selection ?? [];
}

// ═══════════════════════════════════════════════════════════════════
// Interaction Observer (for TestBot replay recording)
// ═══════════════════════════════════════════════════════════════════

export interface InteractionRecord {
  type: "press" | "click";
  label: string;
  stateBefore: unknown;
  stateAfter: unknown;
  timestamp: number;
}

export type InteractionObserver = (record: InteractionRecord) => void;

let _observer: InteractionObserver | null = null;

export function setInteractionObserver(obs: InteractionObserver | null) {
  _observer = obs;
}

// ═══════════════════════════════════════════════════════════════════
// Clipboard Shim — headless equivalent of ClipboardListener
// ═══════════════════════════════════════════════════════════════════

/** Map Meta+c/x/v to OS_COPY/CUT/PASTE (case-insensitive) */
function resolveClipboardShim(key: string): BaseCommand | null {
  const lower = key.toLowerCase();
  if (lower === "meta+c") return OS_COPY();
  if (lower === "meta+x") return OS_CUT();
  if (lower === "meta+v") return OS_PASTE();
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// simulateKeyPress
// ═══════════════════════════════════════════════════════════════════

export function simulateKeyPress(kernel: HeadlessKernel, key: string): void {
  const before = _observer
    ? JSON.parse(JSON.stringify(kernel.getState().os))
    : null;

  // ── Clipboard shim ──
  // In browser: Meta+C/X/V → native copy/cut/paste events → ClipboardListener → OS_COPY/CUT/PASTE
  // In headless: no native events, so we shim these keys directly.
  const clipboardShim = resolveClipboardShim(key);
  if (clipboardShim) {
    kernel.dispatch(clipboardShim);

    if (_observer && before) {
      _observer({
        type: "press",
        label: key,
        stateBefore: before,
        stateAfter: JSON.parse(JSON.stringify(kernel.getState().os)),
        timestamp: performance.now(),
      });
    }
    return;
  }

  // ── Overlay focus trap ──
  // In browser: <dialog>.showModal() natively traps keyboard events.
  // In headless: we guard manually. Only ESC is allowed when overlay is open.
  const overlayStack = kernel.getState().os.overlays?.stack ?? [];
  if (overlayStack.length > 0 && key !== "Escape") {
    if (_observer && before) {
      _observer({
        type: "press",
        label: `${key} (blocked: overlay)`,
        stateBefore: before,
        stateAfter: before,
        timestamp: performance.now(),
      });
    }
    return;
  }

  const activeZoneId = readActiveZoneId(kernel);
  const zone = activeZoneId
    ? kernel.getState().os.focus.zones[activeZoneId]
    : undefined;
  const entry = activeZoneId ? ZoneRegistry.get(activeZoneId) : undefined;
  const childRole = entry?.role ? getChildRole(entry.role) : undefined;

  // Field detection: zone has a registered field → set editingFieldId for ZIFT Field layer
  const editingFieldId = entry?.fieldId ?? null;

  const input: KeyboardInput = {
    canonicalKey: key,
    key,
    isEditing: !!editingFieldId,
    isFieldActive: false,
    isComposing: false,
    isDefaultPrevented: false,
    isInspector: false,
    isCombobox: false,
    editingFieldId,
    focusedItemRole: childRole ?? null,
    focusedItemId: zone?.focusedItemId ?? null,
    focusedItemExpanded:
      zone?.focusedItemId && zone?.expandedItems
        ? zone.expandedItems.includes(zone.focusedItemId)
        : null,
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

  if (_observer && before) {
    _observer({
      type: "press",
      label: key,
      stateBefore: before,
      stateAfter: JSON.parse(JSON.stringify(kernel.getState().os)),
      timestamp: performance.now(),
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// simulateClick
// ═══════════════════════════════════════════════════════════════════

export function simulateClick(
  kernel: HeadlessKernel,
  itemId: string,
  opts?: { shift?: boolean; meta?: boolean; ctrl?: boolean; zoneId?: string },
): void {
  const before = _observer
    ? JSON.parse(JSON.stringify(kernel.getState().os))
    : null;
  const zoneId = opts?.zoneId ?? readActiveZoneId(kernel);
  if (!zoneId) return;

  const entry = ZoneRegistry.get(zoneId);
  const childRole = entry?.role ? getChildRole(entry.role) : undefined;
  const roleExpandable = childRole ? isExpandableRole(childRole) : false;
  const zoneExpandable = entry?.getExpandableItems?.().has(itemId) ?? false;
  const expandable = roleExpandable || zoneExpandable;

  // Phase 1: mousedown — focus + select (immediate visual feedback)
  // Capture pre-mousedown state for correct re-click and editing detection
  const preMousedownFocusedItemId = readFocusedItemId(kernel, zoneId);
  const preMousedownEditingItemId =
    readZone(kernel, zoneId)?.editingItemId ?? null;

  const mouseInput: MouseInput = {
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

  const mouseResult = resolveMouse(mouseInput);
  dispatchResult(kernel, mouseResult);

  // Phase 2: click — activate (expand toggle for tree, action for others)
  const activateOnClick = entry?.config?.activate?.onClick ?? false;
  const reClickOnly = entry?.config?.activate?.reClickOnly ?? false;

  const clickInput: ClickInput = {
    activateOnClick,
    clickedItemId: itemId,
    // reClickOnly: compare against pre-mousedown state (builder pattern)
    // else: compare against post-mousedown state (tree pattern — every click activates)
    focusedItemId: reClickOnly
      ? preMousedownFocusedItemId
      : readFocusedItemId(kernel, zoneId),
    // Editing continuation: if editing before click, pass to resolveClick
    wasEditing: !!preMousedownEditingItemId,
  };

  const clickResult = resolveClick(clickInput);
  dispatchResult(kernel, clickResult);

  if (_observer && before) {
    _observer({
      type: "click",
      label: itemId,
      stateBefore: before,
      stateAfter: JSON.parse(JSON.stringify(kernel.getState().os)),
      timestamp: performance.now(),
    });
  }
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
  const roleExpandable = childRole ? isExpandableRole(childRole) : false;
  const zoneExpandable = entry?.getExpandableItems?.().has(itemId) ?? false;
  const expandable = roleExpandable || zoneExpandable;
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
