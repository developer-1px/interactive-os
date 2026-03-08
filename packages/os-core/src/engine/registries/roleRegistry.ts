/**
 * Role Registry - ARIA Role Presets
 *
 * Defines behavior presets for all ARIA composite widget patterns.
 * Each preset maps to a specific ARIA APG pattern with correct
 * navigation, selection, activation, and dismiss behavior.
 *
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/
 */

import {
  OS_ACTIVATE,
  OS_CHECK,
  OS_EXPAND,
  OS_OVERLAY_CLOSE,
  OS_VALUE_CHANGE,
} from "@os-core/4-command";
import { OS_NAVIGATE } from "@os-core/4-command/navigate";
import { OS_TAB } from "@os-core/4-command/tab/tab";
import type {
  DismissConfig,
  ExpandConfig,
  FocusGroupConfig,
  NavigateConfig,
  ProjectConfig,
  SelectConfig,
  TabConfig,
  ValueConfig,
} from "../../schema/types";
import {
  DEFAULT_DISMISS,
  DEFAULT_EXPAND,
  DEFAULT_NAVIGATE,
  DEFAULT_PROJECT,
  DEFAULT_SELECT,
  DEFAULT_TAB,
  DEFAULT_VALUE,
} from "../../schema/types";
import type { InputMap } from "../../schema/types/focus/config/FocusGroupConfig";
import { DEFAULT_INPUTMAP } from "../../schema/types/focus/config/FocusGroupConfig";
import type { DeepPartial } from "../../schema/types/utils";

// ═══════════════════════════════════════════════════════════════════
// Zone Role Type
// ═══════════════════════════════════════════════════════════════════

/** All supported ARIA role presets for Zone */
export type ZoneRole =
  // Generic
  | "group"
  // List-based
  | "listbox"
  // Menu patterns
  | "menu"
  | "menubar"
  // Selection patterns
  | "radiogroup"
  | "tablist"
  // Toolbar
  | "toolbar"
  // Grid patterns
  | "grid"
  | "treegrid"
  // Tree
  | "tree"
  // Overlay patterns
  | "dialog"
  | "alertdialog"
  // Combobox (input + popup)
  | "combobox"
  // Content patterns
  | "feed"
  | "accordion"
  | "disclosure"
  // Value patterns
  | "slider"
  | "meter"
  | "spinbutton"
  | "separator"
  // Toggle patterns
  | "switch"
  // Custom (non-ARIA)
  | "builderBlock"
  | "application"
  | "textbox"
  | "checkbox";

// ═══════════════════════════════════════════════════════════════════
// Child Role Mapping (Zone role → default Item role)
// ═══════════════════════════════════════════════════════════════════

/** Maps a Zone role to the default ARIA role for its child Items */
const childRoleMap: Partial<Record<ZoneRole, string>> = {
  listbox: "option",
  menu: "menuitem",
  menubar: "menuitem",
  radiogroup: "radio",
  tablist: "tab",
  toolbar: "button",
  grid: "gridcell",
  treegrid: "row",
  tree: "treeitem",
  combobox: "option",
  feed: "article",
  accordion: "button",
  disclosure: "button",
  slider: "slider",
  meter: "meter",
  spinbutton: "spinbutton",
  separator: "separator",
  switch: "switch",
  checkbox: "checkbox",
};

// ═══════════════════════════════════════════════════════════════════
// Content Role Mapping (Zone role → Item.Content ARIA role)
// ═══════════════════════════════════════════════════════════════════

/** Maps a Zone role to the ARIA role for its Item.Content panels */
const contentRoleMap: Partial<Record<ZoneRole, string>> = {
  tablist: "tabpanel",
  accordion: "region",
  tree: "group",
};

/** Visibility source: whether Item.Content uses expandedItems or selectedItems */
export type ContentVisibilitySource = "expanded" | "selected";

const contentVisibilityMap: Partial<Record<ZoneRole, ContentVisibilitySource>> =
  {
    tablist: "selected",
    accordion: "expanded",
    disclosure: "expanded",
    tree: "expanded",
  };

/** Get the ARIA role for Item.Content given a Zone role */
export function getContentRole(
  zoneRole?: ZoneRole | string,
): string | undefined {
  return zoneRole ? contentRoleMap[zoneRole as ZoneRole] : undefined;
}

/** Get the visibility source (expanded vs selected) for Item.Content */
export function getContentVisibilitySource(
  zoneRole?: ZoneRole | string,
): ContentVisibilitySource {
  return (
    (zoneRole ? contentVisibilityMap[zoneRole as ZoneRole] : undefined) ??
    "expanded"
  );
}

/** Get the default child role for a Zone role */
export function getChildRole(zoneRole?: ZoneRole | string): string {
  return (
    (zoneRole ? childRoleMap[zoneRole as ZoneRole] : undefined) || "option"
  );
}

export type RolePreset = DeepPartial<FocusGroupConfig>;

// ═══════════════════════════════════════════════════════════════════
// Built-in Role Presets
// ═══════════════════════════════════════════════════════════════════

const rolePresets: Record<ZoneRole, RolePreset> = {
  // ─── Generic group (no selection, no special behavior) ───
  group: {},

  // ─── Listbox (ARIA APG: Listbox Pattern) ───
  // vertical, no wrap, selection follows focus (single-select),
  // entry to selected item, typeahead. No inputmap (uses followFocus).
  listbox: {
    navigate: {
      orientation: "vertical",
      loop: false,
      typeahead: true,
      entry: "selected",
    },
    select: { mode: "single", followFocus: true, aria: "selected" },
    tab: { behavior: "escape" },
  },

  // ─── Menu (ARIA APG: Menu and Menubar Pattern - vertical submenu) ───
  // Spec: vertical, loop, NO selection (menus activate, not select),
  //       Enter/Space activates immediately, Escape closes,
  //       focus auto-placed on first item when opened
  menu: {
    navigate: {
      orientation: "vertical",
      loop: true,
      entry: "first",
      onCrossAxis: ["expandSubmenu"],
    },
    select: { mode: "none" },
    inputmap: {
      Space: [OS_ACTIVATE()],
      Enter: [OS_ACTIVATE()],
      click: [OS_ACTIVATE()],
    },
    dismiss: { escape: "close", outsideClick: "close" },
    tab: { behavior: "trap" },
    project: { autoFocus: true },
  },

  // ─── Menubar (ARIA APG: Menu and Menubar Pattern - horizontal bar) ───
  // Spec: horizontal, loop, no selection, submenus via arrows,
  //       Tab escapes the menubar. No inputmap (navigation only).
  menubar: {
    navigate: {
      orientation: "horizontal",
      loop: true,
      entry: "restore",
      onDown: ["expandSubmenu"],
    },
    select: { mode: "none" },
    tab: { behavior: "escape" },
  },

  // ─── Radio Group (ARIA APG: Radio Group Pattern) ───
  // Spec: arrows wrap (loop), selection follows focus (selecting = checking),
  //       cannot be empty once checked, entry to checked radio.
  //       radio items use aria-checked → OS_CHECK is the correct command.
  radiogroup: {
    navigate: { orientation: "linear-both", loop: true, entry: "selected" },
    select: {
      mode: "single",
      followFocus: true,
      disallowEmpty: true,
      aria: "checked",
    },
    inputmap: { Space: [OS_CHECK()], click: [OS_CHECK()] },
    tab: { behavior: "escape" },
  },

  // ─── Tablist (ARIA APG: Tabs Pattern) ───
  // Spec: horizontal, loop, selection follows focus (auto-activation),
  //       cannot be empty. No inputmap (uses followFocus).
  tablist: {
    navigate: { orientation: "horizontal", loop: true, entry: "selected" },
    select: { mode: "single", followFocus: true, disallowEmpty: true },
    tab: { behavior: "escape" },
  },

  // ─── Toolbar (ARIA APG: Toolbar Pattern) ───
  // Spec: horizontal, optional loop (we enable), no selection,
  //       button items: Space/Enter → OS_ACTIVATE.
  toolbar: {
    navigate: { orientation: "horizontal", loop: true, entry: "restore" },
    select: { mode: "none" },
    inputmap: {
      Space: [OS_ACTIVATE()],
      Enter: [OS_ACTIVATE()],
      click: [OS_ACTIVATE()],
    },
    tab: { behavior: "escape" },
  },

  // ─── Grid (ARIA APG: Grid Pattern) ───
  // Spec: 2D navigation, no loop (stops at edges),
  //       multi-select via Shift/Ctrl (explicit, not followFocus)
  grid: {
    navigate: { orientation: "both", loop: false },
    select: { mode: "multiple", range: true, toggle: true, followFocus: false },
    tab: { behavior: "escape" },
  },

  // ─── TreeGrid (ARIA APG: Treegrid Pattern) ───
  // Spec: grid + tree hybrid, 2D navigation with expand/collapse,
  //       no loop, explicit selection
  treegrid: {
    navigate: {
      orientation: "vertical",
      loop: false,
      onRight: ["expand", "enterChild"],
      onLeft: ["collapse", "goParent"],
    },
    select: { mode: "multiple", range: true, toggle: true, followFocus: false },
    inputmap: {
      Enter: [OS_EXPAND({ action: "toggle" })],
      click: [OS_EXPAND({ action: "toggle" })],
    },
    expand: { mode: "explicit" },
    tab: { behavior: "escape" },
  },

  // ─── Tree (ARIA APG: Tree View Pattern) ───
  // vertical, no wrap, selection follows focus,
  // entry to selected node, typeahead
  tree: {
    navigate: {
      orientation: "vertical",
      loop: false,
      typeahead: true,
      entry: "selected",
      onRight: ["expand", "enterChild"],
      onLeft: ["collapse", "goParent"],
    },
    select: { mode: "single", followFocus: true },
    inputmap: {
      Enter: [OS_EXPAND({ action: "toggle" })],
      click: [OS_EXPAND({ action: "toggle" })],
    },
    expand: { mode: "explicit" },
    tab: { behavior: "escape" },
  },

  // ─── Dialog (ARIA APG: Dialog Pattern) ───
  // Spec: focus trap, autoFocus first focusable, Escape closes,
  //       Tab cycles within dialog. No inputmap.
  dialog: {
    navigate: { orientation: "vertical", loop: false },
    tab: { behavior: "trap", restoreFocus: true },
    dismiss: { escape: "close", outsideClick: "close", restoreFocus: true },
    project: { autoFocus: true },
  },

  // ─── Alert Dialog (ARIA APG: Alert Dialog Pattern) ───
  // Spec: like dialog but more restrictive — no outside click dismiss,
  //       user must explicitly acknowledge
  alertdialog: {
    navigate: { orientation: "vertical", loop: false },
    tab: { behavior: "trap", restoreFocus: true },
    dismiss: { escape: "none", outsideClick: "none", restoreFocus: true },
    project: { autoFocus: true },
  },

  // ─── Combobox (ARIA APG: Combobox Pattern) ───
  // Spec: input field + popup listbox, vertical navigation in popup,
  //       Escape closes popup, selection follows focus in popup
  combobox: {
    navigate: { orientation: "vertical", loop: false, typeahead: false },
    select: { mode: "single", followFocus: true },
    dismiss: { escape: "close" },
    project: { virtualFocus: true },
    tab: { behavior: "escape" },
  },

  // ─── Feed (ARIA APG: Feed Pattern) ───
  // Spec: vertical infinite scroll, no wrap, articles are items.
  // PageDown/PageUp = next/prev article (same as ArrowDown/ArrowUp).
  // Ctrl+End = exit feed forward, Ctrl+Home = exit feed backward.
  feed: {
    navigate: { orientation: "vertical", loop: false },
    select: { mode: "none" },
    inputmap: {
      PageDown: [OS_NAVIGATE({ direction: "down" })],
      PageUp: [OS_NAVIGATE({ direction: "up" })],
      "Ctrl+End": [OS_TAB({ direction: "forward" })],
      "Ctrl+Home": [OS_TAB({ direction: "backward" })],
    },
    tab: { behavior: "escape" },
  },

  // ─── Accordion (ARIA: disclosure group) ───
  // Spec: vertical, no wrap, Space/Enter/click toggles expand/collapse
  accordion: {
    navigate: { orientation: "vertical", loop: false },
    inputmap: {
      Space: [OS_EXPAND({ action: "toggle" })],
      Enter: [OS_EXPAND({ action: "toggle" })],
      click: [OS_EXPAND({ action: "toggle" })],
    },
    expand: { mode: "all" },
    tab: { behavior: "native" },
  },

  // ─── Disclosure (ARIA: single expand/collapse) ───
  // Spec: Space/Enter/click toggles visibility of associated content
  disclosure: {
    inputmap: {
      Space: [OS_EXPAND({ action: "toggle" })],
      Enter: [OS_EXPAND({ action: "toggle" })],
      click: [OS_EXPAND({ action: "toggle" })],
    },
    expand: { mode: "all" },
    tab: { behavior: "flow" },
  },

  // ─── Builder Block (custom — visual page builder) ───
  builderBlock: {
    navigate: { orientation: "both", seamless: true },
    tab: { behavior: "flow" },
  },

  // ─── Application (custom — full spatial navigation) ───
  application: {
    navigate: { orientation: "both", seamless: true },
    tab: { behavior: "flow" },
  },

  // ─── Textbox (custom — Field zone, keyboard delegated to contenteditable) ───
  textbox: {
    tab: { behavior: "flow" },
  },

  // ─── Meter (ARIA APG: Meter Pattern) ───
  // Spec: read-only numeric display, NO keyboard interaction.
  // Value axis is continuous for aria-valuenow/min/max projection,
  // but Field layer uses "readonly" type so arrow keys are ignored.
  meter: {
    select: { mode: "none" },
    tab: { behavior: "escape" },
    value: { mode: "continuous", min: 0, max: 100, step: 1, largeStep: 10 },
  },

  // ─── Spinbutton (ARIA APG: Spinbutton Pattern) ───
  // Spec: Up/Down arrows change value, Home/End jump to min/max,
  //       PageUp/PageDown adjust by large step. Vertical only.
  spinbutton: {
    navigate: { orientation: "vertical", loop: false },
    select: { mode: "none" },
    tab: { behavior: "escape" },
    value: { mode: "continuous", min: 0, max: 100, step: 1, largeStep: 10 },
  },

  // ─── Separator / Window Splitter (ARIA APG: Window Splitter Pattern) ───
  // Spec: all four arrow keys adjust value (Up/Right = increment, Down/Left = decrement),
  //       Home/End jump to min/max, Enter toggles collapse/restore.
  separator: {
    navigate: { orientation: "vertical", loop: false },
    select: { mode: "none" },
    inputmap: {
      Enter: [OS_VALUE_CHANGE({ action: "toggleCollapse" })],
    },
    tab: { behavior: "escape" },
    value: { mode: "continuous", min: 0, max: 100, step: 1, largeStep: 10 },
  },

  // ─── Slider (ARIA APG: Slider Pattern) ───
  // Spec: Arrow keys adjust value (not navigation), Home/End jump to min/max,
  //       PageUp/PageDown adjust by large step, single focusable element
  slider: {
    navigate: { orientation: "vertical", loop: false },
    select: { mode: "none" },
    tab: { behavior: "escape" },
    value: { mode: "continuous", min: 0, max: 100, step: 1, largeStep: 10 },
  },

  // ─── Switch (ARIA APG: Switch Pattern) ───
  // Spec: on/off toggle, Enter/Space toggles aria-checked,
  //       single focusable element, click also toggles.
  switch: {
    select: { mode: "none" },
    inputmap: {
      Space: [OS_CHECK()],
      Enter: [OS_CHECK()],
      click: [OS_CHECK()],
    },
    tab: { behavior: "escape" },
  },

  // ─── Checkbox (ARIA APG: Checkbox Pattern) ───
  // Spec: on/off toggle, Space toggles aria-checked, Enter does NOT.
  //       click also toggles.
  checkbox: {
    select: { mode: "none" },
    inputmap: { Space: [OS_CHECK()], click: [OS_CHECK()], Enter: [] },
    tab: { behavior: "escape" },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Resolver
// ═══════════════════════════════════════════════════════════════════

export function resolveRole(
  role: ZoneRole | string | undefined,
  overrides: {
    navigate?: Partial<NavigateConfig> | undefined;
    tab?: Partial<TabConfig> | undefined;
    select?: Partial<SelectConfig> | undefined;
    dismiss?: Partial<DismissConfig> | undefined;
    project?: Partial<ProjectConfig> | undefined;
    expand?: Partial<ExpandConfig> | undefined;
    value?: Partial<ValueConfig> | undefined;
    inputmap?: InputMap | undefined;
  } = {},
): FocusGroupConfig {
  if (role && !rolePresets[role as ZoneRole]) {
    console.warn(
      `[Zone] Unknown role: '${role}'. Using default config. Valid roles: ${Object.keys(rolePresets).join(", ")}`,
    );
  }
  const basePreset = role ? (rolePresets[role as ZoneRole] ?? {}) : {};

  return {
    navigate: {
      ...DEFAULT_NAVIGATE,
      ...basePreset.navigate,
      ...(overrides.navigate ?? {}),
    },
    tab: { ...DEFAULT_TAB, ...basePreset.tab, ...(overrides.tab ?? {}) },
    select: {
      ...DEFAULT_SELECT,
      ...basePreset.select,
      ...(overrides.select ?? {}),
    },
    dismiss: {
      ...DEFAULT_DISMISS,
      ...basePreset.dismiss,
      ...(overrides.dismiss ?? {}),
    },
    project: {
      ...DEFAULT_PROJECT,
      ...basePreset.project,
      ...(overrides.project ?? {}),
    },
    expand: {
      ...DEFAULT_EXPAND,
      ...basePreset.expand,
      ...(overrides.expand ?? {}),
    },
    value: {
      ...DEFAULT_VALUE,
      ...basePreset.value,
      ...(overrides.value ?? {}),
    },
    inputmap: {
      ...DEFAULT_INPUTMAP,
      ...(basePreset.inputmap as InputMap | undefined),
      ...(overrides.inputmap ?? {}),
    },
  };
}
