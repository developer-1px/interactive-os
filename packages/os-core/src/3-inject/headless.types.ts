/**
 * Headless Types — shared across compute and simulate modules.
 */

import type { BaseCommand } from "@kernel/core/tokens";
import type { AppState } from "@os-core/engine/kernel";

// ═══════════════════════════════════════════════════════════════════
// HeadlessKernel
// ═══════════════════════════════════════════════════════════════════

/** Minimal kernel interface needed by headless functions */
export interface HeadlessKernel {
  getState(): AppState;
  dispatch(
    cmd: BaseCommand,
    opts?: { scope?: unknown[]; meta?: Record<string, unknown> },
  ): void;
}

// ═══════════════════════════════════════════════════════════════════
// Item Types
// ═══════════════════════════════════════════════════════════════════

export interface ItemAttrs {
  id: string;
  role: string | undefined;
  tabIndex: number;
  "aria-selected"?: boolean | undefined;
  "aria-checked"?: boolean | undefined;
  "aria-pressed"?: boolean | undefined;
  "aria-expanded"?: boolean;
  "aria-disabled"?: boolean;
  "aria-current"?: "true" | undefined;
  "aria-valuenow"?: number;
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;
  "aria-controls"?: string;
  "data-focused"?: true | undefined;
  "data-anchor"?: true | undefined;
  "data-selected"?: true | undefined;
  "data-expanded"?: true | undefined;
  "data-item"?: true;
  "data-editing"?: true;
  hidden?: boolean;
}

export interface ItemOverrides {
  disabled?: boolean | undefined;
  selected?: boolean | undefined;
  role?: string | undefined;
  /** Item-level ARIA check attribute override. Bubbles to Zone config if not set. */
  aria?: "checked" | "pressed" | undefined;
}

export interface ItemState {
  isFocused: boolean;
  isActiveFocused: boolean;
  isAnchor: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  valueNow: number | undefined;
}

export interface ItemResult {
  attrs: ItemAttrs;
  state: ItemState;
}

// ═══════════════════════════════════════════════════════════════════
// Trigger Types
// ═══════════════════════════════════════════════════════════════════

/** ARIA attributes for a Trigger that controls an overlay */
export interface TriggerAttrs {
  "aria-haspopup": "dialog" | "menu" | "true" | "listbox" | "tree" | "grid";
  "aria-expanded": boolean;
  "aria-controls": string;
}

// ═══════════════════════════════════════════════════════════════════
// Element Types
// ═══════════════════════════════════════════════════════════════════

/**
 * Unified element attributes — works for both Zone containers and Items.
 * resolveElement() returns this type.
 */
export type ElementAttrs = Record<
  string,
  string | number | boolean | undefined
>;

// ═══════════════════════════════════════════════════════════════════
// Observer Types
// ═══════════════════════════════════════════════════════════════════

export interface InteractionRecord {
  type: "press" | "click";
  label: string;
  stateBefore: unknown;
  stateAfter: unknown;
  timestamp: number;
}

export type InteractionObserver = (record: InteractionRecord) => void;
