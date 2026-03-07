/**
 * FocusGroupConfig — Unified zone behavior configuration.
 *
 * Structure:
 *   - 6 command parameter axes: Navigate, Tab, Select, Dismiss, Expand, Value
 *   - 1 projection axis: Project (autoFocus, virtualFocus)
 *   - 1 routing table: inputmap (Key/click → Command[])
 *
 * inputmap = APG Keyboard Interaction table in code form.
 * Each key maps an input string to the command(s) it triggers.
 * role preset provides defaults; user overrides as needed.
 */

import type { BaseCommand } from "@kernel";
import type { Orientation } from "../FocusDirection.ts";

// ── Navigate ──

export type NavigateEntry = "first" | "last" | "restore" | "selected";

export interface NavigateConfig {
  orientation: Orientation;
  loop: boolean;
  seamless: boolean;
  typeahead: boolean;
  entry: NavigateEntry;
  recovery: "next" | "prev" | "nearest";
  /** Chain fallback for edge/cross-axis navigation (command-config-invariant) */
  onRight?: string[];
  onLeft?: string[];
  onUp?: string[];
  onDown?: string[];
  onCrossAxis?: string[];
}

export const DEFAULT_NAVIGATE: NavigateConfig = {
  orientation: "vertical",
  loop: false,
  seamless: false,
  typeahead: false,
  entry: "first",
  recovery: "next",
};

// ── Tab ──

export interface TabConfig {
  /** "trap" = cycle within zone, "escape" = jump to next zone,
   *  "flow" = navigate items then escape at boundary,
   *  "native" = OS does not intercept — browser default Tab order */
  behavior: "trap" | "escape" | "flow" | "native";
  restoreFocus: boolean;
}

export const DEFAULT_TAB: TabConfig = {
  behavior: "flow",
  restoreFocus: false,
};

// ── Select ──

export interface SelectConfig {
  mode: "none" | "single" | "multiple";
  followFocus: boolean;
  disallowEmpty: boolean;
  range: boolean;
  toggle: boolean;
  /** Selection scope for grid (command-config-invariant) */
  scope?: "cell" | "column" | "row";
  /** ARIA attribute: "selected" (aria-selected) or "checked" (aria-checked) */
  aria?: "selected" | "checked";
  /** Declarative initial selection — applied at zone mount. Overrides disallowEmpty auto-select. */
  initial?: string | string[];
}

export const DEFAULT_SELECT: SelectConfig = {
  mode: "none",
  followFocus: false,
  disallowEmpty: false,
  range: false,
  toggle: false,
};

// ── Dismiss ──

export interface DismissConfig {
  escape: "close" | "deselect" | "callback" | "none";
  outsideClick: "close" | "none";
  /** Whether to restore focus to invoker after dismiss (command-config-invariant) */
  restoreFocus?: boolean;
}

export const DEFAULT_DISMISS: DismissConfig = {
  escape: "none",
  outsideClick: "none",
};

// ── Project ──

export interface ProjectConfig {
  virtualFocus: boolean;
  autoFocus: boolean;
}

export const DEFAULT_PROJECT: ProjectConfig = {
  virtualFocus: false,
  autoFocus: false,
};

// ── Expand (aria-expanded) ──

export interface ExpandConfig {
  /**
   * "all"      — every item is expandable (accordion, disclosure)
   * "explicit" — only items in getExpandableItems (tree, menu)
   * "none"     — no expansion (listbox, toolbar)
   */
  mode: "all" | "explicit" | "none";
  /** Declarative initial expanded items — applied at zone mount. */
  initial?: string[];
}

export const DEFAULT_EXPAND: ExpandConfig = {
  mode: "none",
};

// ── InputMap (APG Keyboard Interaction table) ──

/**
 * InputMap — input string → command chain routing table.
 *
 * Keys are input identifiers:
 *   Keyboard: "Space", "Enter", "ArrowDown", etc.
 *   Mouse: "click", "Shift+click", "Meta+click"
 *
 * Values are command chains dispatched when that input fires.
 * Command type determines ARIA effect:
 *   OS_CHECK()  → aria-checked
 *   OS_PRESS()  → aria-pressed
 *   OS_EXPAND() → aria-expanded
 *   OS_ACTIVATE() → pure action (no ARIA state)
 *
 * Examples:
 *   checkbox:  { Space: [OS_CHECK()], click: [OS_CHECK()] }
 *   accordion: { Space: [OS_EXPAND(toggle)], Enter: [OS_EXPAND(toggle)], click: [OS_EXPAND(toggle)] }
 *   menu:      { Space: [OS_ACTIVATE()], Enter: [OS_ACTIVATE()], click: [OS_ACTIVATE()] }
 */
export type InputMap = { [key: string]: BaseCommand[] };

export const DEFAULT_INPUTMAP: InputMap = {};

// ── Value (aria-valuenow/min/max — slider, spinbutton, separator) ──

export interface ValueConfig {
  /**
   * "continuous" — item has a numeric value within a range (slider, spinbutton)
   * "none"       — no value axis (default for all other roles)
   */
  mode: "continuous" | "none";
  /** Minimum allowed value (aria-valuemin) */
  min: number;
  /** Maximum allowed value (aria-valuemax) */
  max: number;
  /** Step increment for Arrow keys */
  step: number;
  /** Large step increment for PageUp/PageDown */
  largeStep: number;
  /** Declarative initial values per item — applied atomically at Zone mount */
  initial?: Record<string, number>;
}

export const DEFAULT_VALUE: ValueConfig = {
  mode: "none",
  min: 0,
  max: 100,
  step: 1,
  largeStep: 10,
};

// ── Composed ──

export interface FocusGroupConfig {
  navigate: NavigateConfig;
  tab: TabConfig;
  select: SelectConfig;
  dismiss: DismissConfig;
  project: ProjectConfig;
  expand: ExpandConfig;
  value: ValueConfig;
  /** APG Keyboard Interaction table: input → command[] routing */
  inputmap: InputMap;
}

export const DEFAULT_CONFIG: FocusGroupConfig = {
  navigate: DEFAULT_NAVIGATE,
  tab: DEFAULT_TAB,
  select: DEFAULT_SELECT,
  dismiss: DEFAULT_DISMISS,
  project: DEFAULT_PROJECT,
  expand: DEFAULT_EXPAND,
  value: DEFAULT_VALUE,
  inputmap: DEFAULT_INPUTMAP,
};
