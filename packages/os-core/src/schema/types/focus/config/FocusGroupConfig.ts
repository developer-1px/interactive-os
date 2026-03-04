/**
 * FocusGroupConfig — Unified zone behavior configuration.
 *
 * All 8 sub-configs map 1:1 to a W3C APG concern:
 *   Navigate, Tab, Select, Activate, Dismiss, Project, Expand, Check.
 *
 * v10: action axis 통합. activate/check/expand → action: BaseCommand[] 단일 축.
 * activate/check/expand는 레거시 — action 축 마이그레이션 완료 후 제거.
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
  /** What effect ACTIVATE produces (command-config-invariant) */
  effect?: "default" | "toggleExpand" | "invokeAndClose" | "selectTab";
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
}

export const DEFAULT_EXPAND: ExpandConfig = {
  mode: "none",
};

// ── Action (unified: activate / check / expand / open) ──

/**
 * ActionKey — 키보드 트리거 키 목록
 */
export type ActionKey = "Space" | "Enter" | "ArrowDown" | "ArrowUp";

/**
 * ActionConfig — Zone의 Item에 적용되는 선언적 action 설정.
 *
 * command 타입이 ARIA 상태를 결정한다:
 *   OS_CHECK()  → aria-checked  (checkbox, radio, menuitemcheckbox)
 *   OS_PRESS()  → aria-pressed  (toggle button)
 *   OS_EXPAND() → aria-expanded (treeitem, accordion)
 *   OS_SELECT() → aria-selected (option, tab)
 *   OS_OVERLAY_OPEN() → aria-haspopup + aria-expanded (trigger)
 *   OS_ACTIVATE() → aria 상태 없음 (pure action)
 *
 * aria config는 불필요 — command 타입에서 자동 파생.
 *
 * 예시:
 *   checkbox:      { commands: [OS_CHECK()] }
 *   toggle_button: { commands: [OS_PRESS()] }
 *   treeitem:      { commands: [OS_EXPAND({ action: "toggle" })] }
 *   menuitem:      { commands: [OS_ACTIVATE(), OS_OVERLAY_CLOSE()] }
 *   menu_button:   {
 *     commands: [OS_OVERLAY_OPEN({ entry: "first" })],
 *     keymap: { ArrowUp: [OS_OVERLAY_OPEN({ entry: "last" })] }
 *   }
 *
 * @see design-principles.md #31
 */
export interface ActionConfig {
  /** 기본 action chain — 지정된 keys 전체에 동일하게 dispatch */
  commands: BaseCommand[];
  /**
   * 이 action을 트리거하는 키 목록.
   * 미지정 시 첫 command 타입에서 자동 파생:
   *   OS_CHECK/OS_PRESS → ["Space"]
   *   OS_EXPAND/OS_ACTIVATE → ["Space", "Enter"]
   *   OS_OVERLAY_OPEN → ["Space", "Enter", "ArrowDown"]
   */
  keys?: ActionKey[];
  /**
   * per-key command override.
   * 지정된 키에 대해서는 commands 대신 이 command chain을 dispatch.
   * 나머지 keys는 commands를 사용.
   *
   * 예: ArrowUp → OS_OVERLAY_OPEN({ entry: "last" })
   *     (다른 키는 entry: "first" commands 사용)
   */
  keymap?: Partial<Record<ActionKey, BaseCommand[]>>;
  /** Click이 이 action을 트리거하는지. 미지정 시 첫 command 타입에서 자동 파생. */
  onClick?: boolean;
}

export const DEFAULT_ACTION: ActionConfig = {
  commands: [],
};


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
  /** @deprecated → action */
  activate: ActivateConfig;
  dismiss: DismissConfig;
  project: ProjectConfig;
  /** @deprecated → action */
  expand: ExpandConfig;
  value: ValueConfig;
  /** v10: unified action axis. activate/check/expand를 대체. */
  action: ActionConfig;
}

export const DEFAULT_CONFIG: FocusGroupConfig = {
  navigate: DEFAULT_NAVIGATE,
  tab: DEFAULT_TAB,
  select: DEFAULT_SELECT,
  activate: DEFAULT_ACTIVATE,
  dismiss: DEFAULT_DISMISS,
  project: DEFAULT_PROJECT,
  expand: DEFAULT_EXPAND,
  value: DEFAULT_VALUE,
  action: DEFAULT_ACTION,
};
