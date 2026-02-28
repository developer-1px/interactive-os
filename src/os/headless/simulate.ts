/**
 * Headless Simulate — interaction simulation + zone registration.
 *
 * Used by test infrastructure only (createOsPage, defineApp.page).
 * NOT imported by production components.
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
import {
  buildZoneEntry,
  createZoneConfig,
  generateZoneId,
  type ZoneCallbacks,
} from "@os/2-contexts/zoneLogic";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OS_COPY, OS_CUT, OS_PASTE } from "@os/3-commands/clipboard/clipboard";
import { OS_ZONE_INIT } from "@os/3-commands/focus";
import { getChildRole, type ZoneRole } from "@os/registries/roleRegistry";
import { readActiveZoneId, readFocusedItemId } from "./compute";
import type { HeadlessKernel, InteractionObserver } from "./types";

// ═══════════════════════════════════════════════════════════════════
// Interaction Observer
// ═══════════════════════════════════════════════════════════════════

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
  const overlayStack = kernel.getState().os.overlays?.stack ?? [];
  if (overlayStack.length > 0 && key !== "Escape") {
    const activeZoneId = readActiveZoneId(kernel);
    const isInsideOverlay = overlayStack.some(
      (e: Record<string, unknown>) => e.id === activeZoneId,
    );
    if (!isInsideOverlay) {
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
  }

  const activeZoneId = readActiveZoneId(kernel);
  const zone = activeZoneId
    ? kernel.getState().os.focus.zones[activeZoneId]
    : undefined;
  const entry = activeZoneId ? ZoneRegistry.get(activeZoneId) : undefined;
  const childRole = entry?.role ? getChildRole(entry.role) : undefined;

  const editingFieldId = entry?.fieldId ?? null;

  const focusedId = zone?.focusedItemId ?? null;
  const expandableItems = entry?.getExpandableItems?.() ?? new Set<string>();
  const isFocusedExpandable = focusedId
    ? expandableItems.has(focusedId)
    : false;

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
    focusedItemId: focusedId,
    focusedItemExpanded: isFocusedExpandable
      ? (zone?.expandedItems?.includes(focusedId!) ?? false)
      : null,
    activeZoneHasCheck: !!entry?.onCheck,
    activeZoneFocusedItemId: focusedId,
    elementId: focusedId ?? undefined,
    cursor: focusedId
      ? {
          focusId: focusedId,
          selection: zone?.selection ?? [],
          anchor: zone?.selectionAnchor ?? null,
          isExpandable: isFocusedExpandable,
          isDisabled: false,
          treeLevel: undefined,
        }
      : null,
  };

  const result = resolveKeyboard(input);

  // Pipeline logging: keybinding resolution
  if (result.commands.length > 0) {
    console.debug(
      `[keybind] ${key} → ${result.commands.map((c: Record<string, unknown>) => c.type).join(", ")}`,
    );
  } else {
    console.debug(`[keybind] ${key} → (no match)`);
  }

  dispatchResult(kernel, result);

  // Pipeline logging: dispatch + focus change
  if (result.commands.length > 0) {
    for (const cmd of result.commands) {
      console.debug(`[dispatch] ${(cmd as Record<string, unknown>).type}`);
    }
  }

  // Focus change detection
  const afterState = kernel.getState().os;
  const afterZoneId = afterState?.focus?.activeZoneId;
  const afterFocused = afterZoneId
    ? afterState.focus.zones[afterZoneId]?.focusedItemId
    : null;
  const beforeFocused = before?.focus?.activeZoneId
    ? before.focus.zones[before.focus.activeZoneId]?.focusedItemId
    : null;
  if (afterFocused !== beforeFocused) {
    console.info(
      `[focus] ${beforeFocused ?? "null"} → ${afterFocused ?? "null"}`,
    );
  }

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

  const zoneId =
    opts?.zoneId ??
    ZoneRegistry.findZoneByItemId(itemId) ??
    readActiveZoneId(kernel);

  if (!zoneId) {
    const cb = ZoneRegistry.findItemCallback(itemId);
    if (cb?.onActivate) {
      kernel.dispatch(cb.onActivate);
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
    return;
  }

  const entry = ZoneRegistry.get(zoneId);
  const childRole = entry?.role ? getChildRole(entry.role) : undefined;

  // Expand axis — config-driven
  const expandMode = entry?.config?.expand?.mode ?? "none";
  const expandable =
    expandMode === "all"
      ? true
      : expandMode === "explicit"
        ? (entry?.getExpandableItems?.().has(itemId) ?? false)
        : false;

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

  const activateOnClick = entry?.config?.activate?.onClick ?? false;
  const reClickOnly = entry?.config?.activate?.reClickOnly ?? false;

  const clickInput: ClickInput = {
    activateOnClick,
    clickedItemId: itemId,
    focusedItemId: reClickOnly
      ? preMousedownFocusedItemId
      : readFocusedItemId(kernel, zoneId),
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

// ═══════════════════════════════════════════════════════════════════
// readZone (local helper for simulateClick)
// ═══════════════════════════════════════════════════════════════════

function readZone(kernel: HeadlessKernel, zoneId?: string) {
  const id = zoneId ?? readActiveZoneId(kernel);
  return id ? kernel.getState().os.focus.zones[id] : undefined;
}

// ═══════════════════════════════════════════════════════════════════
// Headless Zone Lifecycle
// ═══════════════════════════════════════════════════════════════════

export interface HeadlessZoneOptions {
  /** Zone ID (auto-generated if not provided) */
  id?: string;
  /** ARIA role preset */
  role?: ZoneRole;
  /** Ordered item IDs in this zone */
  items?: string[];
  /** Parent zone ID (for nested zones) */
  parentId?: string | null;
  /** Zone callbacks (onAction, onSelect, etc.) */
  callbacks?: ZoneCallbacks;
}

/**
 * Register a Zone in headless mode — no React, no DOM.
 *
 * Creates a fully functional Zone entry in ZoneRegistry and
 * initializes kernel state via OS_ZONE_INIT. The zone is
 * immediately available for simulateKeyPress/simulateClick.
 *
 * @returns The zone ID (auto-generated or provided)
 */
export function registerHeadlessZone(
  kernel: HeadlessKernel,
  options: HeadlessZoneOptions = {},
): string {
  const zoneId = options.id ?? generateZoneId();
  const config = createZoneConfig(options.role);
  const items = options.items;

  const entry = buildZoneEntry(config, options.role, options.parentId ?? null, {
    ...options.callbacks,
    ...(items ? { getItems: () => items } : {}),
  });

  ZoneRegistry.register(zoneId, entry);
  kernel.dispatch(OS_ZONE_INIT(zoneId));

  return zoneId;
}

/**
 * Unregister a headless Zone — cleanup from ZoneRegistry.
 */
export function unregisterHeadlessZone(zoneId: string): void {
  ZoneRegistry.unregister(zoneId);
}
