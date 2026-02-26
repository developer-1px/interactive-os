/**
 * FocusGroupConfig — Unified zone behavior configuration.
 *
 * All sub-configs (Navigate, Tab, Select, Activate, Dismiss, Project)
 * are defined here in a single file. Each maps 1:1 to a W3C APG concern.
 */

import type { Orientation } from "../FocusDirection.ts";

// ── Navigate ──

export type NavigateEntry = "first" | "last" | "restore" | "selected";

export interface NavigateConfig {
  orientation: Orientation;
  loop: boolean;
  seamless: boolean;
  typeahead: boolean;
  /** ArrowRight/Left handle expand/collapse instead of navigation (tree/treegrid) */
  arrowExpand: boolean;
  entry: NavigateEntry;
  recovery: "next" | "prev" | "nearest";
}

export const DEFAULT_NAVIGATE: NavigateConfig = {
  orientation: "vertical",
  loop: false,
  seamless: false,
  typeahead: false,
  arrowExpand: false,
  entry: "first",
  recovery: "next",
};

// ── Tab ──

export interface TabConfig {
  behavior: "trap" | "escape" | "flow";
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
}

export const DEFAULT_SELECT: SelectConfig = {
  mode: "none",
  followFocus: false,
  disallowEmpty: false,
  range: false,
  toggle: false,
};

// ── Activate ──

export interface ActivateConfig {
  mode: "manual" | "automatic";
  /** When true, clicking an item dispatches OS_ACTIVATE (Navigation Tree pattern). */
  onClick: boolean;
  /**
   * When true, OS_ACTIVATE only fires on re-click (clicking an already-focused item).
   * First clicks only focus+select without activating.
   * This enables the Figma/Slides "Select-then-Edit" pattern.
   * Default: false (activate on every click, tree pattern).
   */
  reClickOnly: boolean;
}

export const DEFAULT_ACTIVATE: ActivateConfig = {
  mode: "manual",
  onClick: false,
  reClickOnly: false,
};

// ── Dismiss ──

export interface DismissConfig {
  escape: "close" | "deselect" | "callback" | "none";
  outsideClick: "close" | "none";
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

// ── Composed ──

export interface FocusGroupConfig {
  navigate: NavigateConfig;
  tab: TabConfig;
  select: SelectConfig;
  activate: ActivateConfig;
  dismiss: DismissConfig;
  project: ProjectConfig;
}

export const DEFAULT_CONFIG: FocusGroupConfig = {
  navigate: DEFAULT_NAVIGATE,
  tab: DEFAULT_TAB,
  select: DEFAULT_SELECT,
  activate: DEFAULT_ACTIVATE,
  dismiss: DEFAULT_DISMISS,
  project: DEFAULT_PROJECT,
};
