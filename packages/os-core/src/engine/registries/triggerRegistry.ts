/**
 * Trigger Registry — Trigger Role Presets
 *
 * Defines behavior presets for overlay trigger patterns.
 * Each preset maps to a W3C APG pattern with correct
 * open, focus, and ARIA behavior.
 *
 * Follows the same pattern as roleRegistry.ts (Zone role presets).
 *
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/
 */

import type { Keymap } from "@os-core/2-resolve/chainResolver";
import { OS_OVERLAY_CLOSE, OS_OVERLAY_OPEN } from "@os-core/4-command";
import {
  DEFAULT_TRIGGER_CONFIG,
  type TriggerConfig,
} from "../../schema/types/focus/config/TriggerConfig";
import type { DeepPartial } from "../../schema/types/utils";

// ═══════════════════════════════════════════════════════════════════
// Trigger Role Type
// ═══════════════════════════════════════════════════════════════════

export type TriggerRole =
  | "menu"
  | "dialog"
  | "alertdialog"
  | "listbox"
  | "popover"
  | "tooltip";

// ═══════════════════════════════════════════════════════════════════
// Built-in Trigger Presets
// ═══════════════════════════════════════════════════════════════════

const triggerPresets: Record<TriggerRole, DeepPartial<TriggerConfig>> = {
  // ─── Menu Button (APG: Menu Button Pattern) ───
  // Enter/Space/Click open, ArrowDown/Up also open
  menu: {
    open: {
      onActivate: true,
      onClick: true,
      onArrowDown: true,
      onArrowUp: true,
    },
    focus: { onOpen: "first", onClose: "restore" },
    aria: { haspopup: "true" },
  },

  // ─── Dialog Trigger (APG: Dialog Pattern) ───
  // Enter/Space/Click open, arrows do NOT open
  dialog: {
    open: {
      onActivate: true,
      onClick: true,
    },
    focus: { onOpen: "first", onClose: "restore" },
    aria: { haspopup: "dialog" },
  },

  // ─── Alert Dialog Trigger ───
  alertdialog: {
    open: {
      onActivate: true,
      onClick: true,
    },
    focus: { onOpen: "first", onClose: "restore" },
    aria: { haspopup: "dialog" },
  },

  // ─── Listbox Trigger (APG: Combobox / Select) ───
  // Enter/Space/Click/ArrowDown open
  listbox: {
    open: {
      onActivate: true,
      onClick: true,
      onArrowDown: true,
      onArrowUp: true,
    },
    focus: { onOpen: "first", onClose: "restore" },
    aria: { haspopup: "listbox" },
  },

  // ─── Popover Trigger ───
  popover: {
    open: {
      onActivate: true,
      onClick: true,
    },
    focus: { onOpen: "first", onClose: "restore" },
    aria: { haspopup: "true" },
  },

  // ─── Tooltip Trigger (APG: Tooltip Pattern) ───
  // Hover opens, no keyboard open, no focus change
  tooltip: {
    open: {
      onActivate: false,
      onClick: false,
      onHover: true,
    },
    focus: { onOpen: "none", onClose: "none" },
    aria: { haspopup: false },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Resolver
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve a TriggerConfig from a trigger role, with optional overrides.
 * Follows the same deep-merge pattern as resolveRole().
 */
export function resolveTriggerRole(
  role: TriggerRole | string | undefined,
): TriggerConfig {
  const preset = role ? (triggerPresets[role as TriggerRole] ?? {}) : {};

  return {
    open: {
      ...DEFAULT_TRIGGER_CONFIG.open,
      ...preset.open,
    },
    focus: {
      ...DEFAULT_TRIGGER_CONFIG.focus,
      ...preset.focus,
    },
    aria: {
      ...DEFAULT_TRIGGER_CONFIG.aria,
      ...preset.aria,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// Keymap Builders
// ═══════════════════════════════════════════════════════════════════

interface TriggerKeymapContext {
  overlayId: string;
  triggerRole: string;
  triggerId?: string;
}

/**
 * Build a keyboard Keymap from TriggerConfig.
 * Returns a static Keymap with OS commands baked in.
 * When overlay is already open, returns empty (Zone owns keyboard).
 *
 * @see design-principles.md #23
 */
export function buildTriggerKeymap(
  config: TriggerConfig,
  ctx: TriggerKeymapContext,
  isOverlayOpen: boolean,
): Keymap {
  if (isOverlayOpen) return {};

  const keymap: Keymap = {};
  const base = {
    id: ctx.overlayId,
    type: ctx.triggerRole,
    triggerId: ctx.triggerId,
  };

  if (config.open.onActivate) {
    keymap.Enter = OS_OVERLAY_OPEN(base);
    keymap.Space = OS_OVERLAY_OPEN(base);
  }
  if (config.open.onArrowDown) {
    keymap.ArrowDown = OS_OVERLAY_OPEN({ ...base, entry: "first" as const });
  }
  if (config.open.onArrowUp) {
    keymap.ArrowUp = OS_OVERLAY_OPEN({ ...base, entry: "last" });
  }

  return keymap;
}

/**
 * Build a click Keymap from TriggerConfig.
 * Uses [CLOSE, OPEN] chain for toggle semantics.
 *
 * @see design-principles.md #25
 */
export function buildTriggerClickKeymap(
  config: TriggerConfig,
  ctx: TriggerKeymapContext,
): Keymap {
  if (!config.open.onClick) return {};

  const base = {
    id: ctx.overlayId,
    type: ctx.triggerRole,
    triggerId: ctx.triggerId,
  };
  return {
    Click: [OS_OVERLAY_CLOSE({ id: ctx.overlayId }), OS_OVERLAY_OPEN(base)],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Trigger Overlay Runtime Registry
//
// Runtime registry for trigger→overlay relationships.
// Used by computeTrigger() for headless ARIA projection,
// and by senseKeyboard/senseMouse for trigger key resolution.
//
// Lifecycle: independent of Zone mount/unmount.
//   - Set by os-sdk/defineApp trigger binding
//   - Read by 1-listen sense* and 3-inject compute
// ═══════════════════════════════════════════════════════════════════

const triggerOverlays = new Map<
  string,
  { overlayId: string; overlayType: string }
>();

export const TriggerOverlayRegistry = {
  set(triggerId: string, overlayId: string, overlayType: string): void {
    triggerOverlays.set(triggerId, { overlayId, overlayType });
  },

  clear(triggerId: string): void {
    triggerOverlays.delete(triggerId);
  },

  get(
    triggerId: string,
  ): { overlayId: string; overlayType: string } | undefined {
    return triggerOverlays.get(triggerId);
  },
};
