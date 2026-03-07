/**
 * Headless Simulate — interaction simulation + zone registration.
 *
 * Used by test infrastructure only (createTestBench, createHeadlessPage).
 * NOT imported by production components.
 */

import type { BaseCommand } from "@kernel/core/tokens";
import {
  type KeyboardInput,
  resolveKeyboard,
} from "@os-core/1-listen/keyboard/resolveKeyboard";
import {
  type ClickInput,
  resolveClick,
} from "@os-core/1-listen/mouse/resolveClick";
import {
  type MouseInput,
  resolveMouse,
} from "@os-core/1-listen/mouse/resolveMouse";
import { normalizeKeyDefinition } from "@os-core/2-resolve/getCanonicalKey";
import { isKeyDelegatedToOS } from "@os-core/2-resolve/fieldKeyOwnership";
import { ROLE_FIELD_TYPE_MAP } from "@os-core/2-resolve/resolveFieldKey";
import {
  readActiveZoneId,
  readFocusedItemId,
  readZone,
} from "@os-core/3-inject/compute";
import type {
  HeadlessKernel,
  InteractionObserver,
} from "@os-core/3-inject/headless.types";
import {
  buildZoneEntry,
  createZoneConfig,
  generateZoneId,
  type ZoneCallbacks,
} from "@os-core/3-inject/zoneContext";
import {
  OS_COPY,
  OS_CUT,
  OS_PASTE,
} from "@os-core/4-command/clipboard/clipboard";
import { buildZoneCursor } from "@os-core/4-command/utils/buildZoneCursor";
import {
  getChildRole,
  type ZoneRole,
} from "@os-core/engine/registries/roleRegistry";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { FieldRegistry } from "@os-core/engine/registries/fieldRegistry";

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
// buildKeyboardInput — extracted for testability (isomorphism contract)
// ═══════════════════════════════════════════════════════════════════

/**
 * Build a KeyboardInput from OS state — headless equivalent of senseKeyboard.
 *
 * senseKeyboard reads DOM + OS state → KeyboardInput.
 * buildKeyboardInput reads OS state only → KeyboardInput.
 *
 * These two functions must produce identical values for all OS-derived fields.
 * DOM-only fields (isComposing, isDefaultPrevented, isInspector, isCombobox)
 * are hardcoded to safe defaults since they have no headless equivalent.
 *
 * @see senseKeyboard.ts — browser ground truth
 * @see zero-drift.md — L4 Sense Isomorphism
 */
export function buildKeyboardInput(kernel: HeadlessKernel, key: string): KeyboardInput {
  const activeZoneId = readActiveZoneId(kernel);
  const zone = activeZoneId
    ? kernel.getState().os.focus.zones[activeZoneId]
    : undefined;
  const entry = activeZoneId ? ZoneRegistry.get(activeZoneId) : undefined;
  const childRole = entry?.role ? getChildRole(entry.role) : undefined;

  // Mirror senseKeyboard.ts ground truth:
  // 1. zone?.editingItemId — OS state set by OS_FIELD_START_EDIT (inline editing)
  // 2. entry?.fieldId — always-active field (draft, search zones)
  const editingFieldId = zone?.editingItemId ?? entry?.fieldId ?? null;

  const focusedId = zone?.focusedItemId ?? null;

  // Role → FieldType mapping for always-active Fields
  const activeFieldType = childRole
    ? (ROLE_FIELD_TYPE_MAP[childRole] ?? null)
    : null;

  return {
    canonicalKey: key,
    key,
    isEditing: !!editingFieldId,
    // Mirror senseKeyboard.ts: resolveIsEditingForKey(target, key)
    // Pure equivalent: if editing, check if the key is NOT delegated to OS
    // (i.e., the field absorbs it)
    isFieldActive: editingFieldId
      ? !isKeyDelegatedToOS(key, FieldRegistry.getField(editingFieldId)?.config.fieldType ?? "inline")
      : false,
    isComposing: false,
    isDefaultPrevented: false,
    isInspector: false,
    isCombobox: false,
    editingFieldId,
    activeFieldType,
    focusedItemId: focusedId,
    activeZoneFocusedItemId: focusedId,
    activeZoneInputmap: entry?.config?.inputmap ?? null,
    focusedTriggerId: null,
    focusedTriggerRole: null,
    focusedTriggerOverlayId: null,
    isTriggerOverlayOpen: false,
    elementId: focusedId ?? undefined,
    cursor: buildZoneCursor(zone),
  };
}

// ═══════════════════════════════════════════════════════════════════
// simulateKeyPress
// ═══════════════════════════════════════════════════════════════════

export function simulateKeyPress(kernel: HeadlessKernel, rawKey: string): void {
  // Normalize key to canonical form (e.g., "Control+End" → "Ctrl+End")
  const key = normalizeKeyDefinition(rawKey);

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
    const isInsideOverlay = overlayStack.some((e) => e.id === activeZoneId);
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

  const input = buildKeyboardInput(kernel, key);

  const result = resolveKeyboard(input);

  // Pipeline logging: keybinding resolution
  if (result.commands.length > 0) {
    console.debug(
      `[keybind] ${key} → ${result.commands.map((c) => c.type).join(", ")}`,
    );
  } else {
    console.debug(`[keybind] ${key} → (no match)`);
  }

  dispatchResult(kernel, result);

  // Pipeline logging: dispatch + focus change
  if (result.commands.length > 0) {
    for (const cmd of result.commands) {
      console.debug(`[dispatch] ${cmd.type}`);
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

  // Check item callbacks first (triggers have onActivate but are NOT zone items)
  const itemCb = ZoneRegistry.findItemCallback(itemId);
  if (itemCb?.onActivate) {
    kernel.dispatch(itemCb.onActivate);
    if (_observer && before) {
      _observer({
        type: "click",
        label: itemId,
        stateBefore: before,
        stateAfter: JSON.parse(JSON.stringify(kernel.getState().os)),
        timestamp: performance.now(),
      });
    }
    return;
  }

  const zoneId =
    opts?.zoneId ??
    ZoneRegistry.findZoneByItemId(itemId) ??
    readActiveZoneId(kernel);

  if (!zoneId) {
    return;
  }

  const entry = ZoneRegistry.get(zoneId);
  const childRole = entry?.role ? getChildRole(entry.role) : undefined;

  // Expand axis — config-driven
  const expandable = ZoneRegistry.isExpandable(zoneId, itemId);

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

  // inputmap["click"] — direct click→command routing from APG table
  const clickCommands = entry?.config?.inputmap?.["click"] ?? [];
  const activateOnClick = clickCommands.length > 0;

  const clickInput: ClickInput = {
    activateOnClick,
    clickedItemId: itemId,
    focusedItemId: readFocusedItemId(kernel, zoneId),
    wasEditing: !!preMousedownEditingItemId,
    ...(clickCommands.length > 0 ? { actionCommands: clickCommands } : {}),
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
 * Registers in ZoneRegistry only. Kernel state is lazily created
 * by the first command (e.g., OS_FOCUS) via ensureZone. The zone is
 * immediately available for simulateKeyPress/simulateClick.
 *
 * @returns The zone ID (auto-generated or provided)
 */
export function registerHeadlessZone(
  _kernel: HeadlessKernel,
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

  return zoneId;
}

/**
 * Unregister a headless Zone — cleanup from ZoneRegistry.
 */
export function unregisterHeadlessZone(zoneId: string): void {
  ZoneRegistry.unregister(zoneId);
}
