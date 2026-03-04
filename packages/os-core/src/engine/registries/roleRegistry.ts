/**
 * Role Registry - ARIA Role Presets
 *
 * Defines behavior presets for all ARIA composite widget patterns.
 * Each preset maps to a specific ARIA APG pattern with correct
 * navigation, selection, activation, and dismiss behavior.
 *
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/
 */

import type {
  ActionConfig,
  ActionKey,
  ActivateConfig,
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
  DEFAULT_ACTION,
  DEFAULT_ACTIVATE,
  DEFAULT_DISMISS,
  DEFAULT_EXPAND,
  DEFAULT_NAVIGATE,
  DEFAULT_PROJECT,
  DEFAULT_SELECT,
  DEFAULT_TAB,
  DEFAULT_VALUE,
} from "../../schema/types";
import {
  OS_ACTIVATE,
  OS_CHECK,
  OS_EXPAND,
  OS_OVERLAY_CLOSE,
} from "@os-core/4-command";

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
  treegrid: "gridcell",
  tree: "treeitem",
  combobox: "option",
  feed: "article",
  accordion: "button",
  slider: "slider",
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

/** Roles where items should use `aria-checked` instead of `aria-selected` */
const CHECKED_ROLES = new Set([
  "radio",
  "menuitemradio",
  "menuitemcheckbox",
  "checkbox",
  "switch",
]);

/** Roles where items can be expanded/collapsed */
/** Roles that are ALWAYS expandable (inherent to the role). treeitem is NOT here — expandability depends on children. */
const EXPANDABLE_ROLES = new Set(["menuitem"]);

/** Get the default child role for a Zone role */
export function getChildRole(zoneRole?: ZoneRole | string): string {
  return (
    (zoneRole ? childRoleMap[zoneRole as ZoneRole] : undefined) || "option"
  );
}

/** Check if a role uses aria-checked (vs aria-selected) */
export function isCheckedRole(role: string): boolean {
  return CHECKED_ROLES.has(role);
}

/** Check if a role supports aria-expanded */
export function isExpandableRole(role: string): boolean {
  return EXPANDABLE_ROLES.has(role);
}

// ═══════════════════════════════════════════════════════════════════
// Deep Partial Type
// ═══════════════════════════════════════════════════════════════════

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RolePreset = DeepPartial<FocusGroupConfig>;

// ═══════════════════════════════════════════════════════════════════
// Built-in Role Presets
// ═══════════════════════════════════════════════════════════════════

const rolePresets: Record<ZoneRole, RolePreset> = {
  // ─── Generic group (no selection, no special behavior) ───
  group: {},

  // ─── Listbox (ARIA APG: Listbox Pattern) ───
  // vertical, no wrap, selection follows focus (single-select),
  // entry to selected item, typeahead (IME-safe via keyCode 229 guard)
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
    activate: { mode: "automatic", onClick: true },
    action: { commands: [OS_ACTIVATE(), OS_OVERLAY_CLOSE()] },
    dismiss: { escape: "close", outsideClick: "close" },
    tab: { behavior: "trap" },
    project: { autoFocus: true },
  },

  // ─── Menubar (ARIA APG: Menu and Menubar Pattern - horizontal bar) ───
  // Spec: horizontal, loop, no selection, submenus via arrows,
  //       Tab escapes the menubar
  menubar: {
    navigate: {
      orientation: "horizontal",
      loop: true,
      entry: "restore",
      onDown: ["expandSubmenu"],
    },
    select: { mode: "none" },
    activate: { mode: "automatic" },
    tab: { behavior: "escape" },
  },

  // ─── Radio Group (ARIA APG: Radio Group Pattern) ───
  // Spec: arrows wrap (loop), selection follows focus (selecting = checking),
  //       cannot be empty once checked, entry to checked radio.
  //       radio items use aria-checked → OS_CHECK is the correct command.
  radiogroup: {
    navigate: { orientation: "linear-both", loop: true, entry: "selected" },
    select: { mode: "single", followFocus: true, disallowEmpty: true },
    action: { commands: [OS_CHECK()], keys: ["Space"] },
    tab: { behavior: "escape" },
  },

  // ─── Tablist (ARIA APG: Tabs Pattern) ───
  // Spec: horizontal, loop, selection follows focus (auto-activation),
  //       cannot be empty, entry to selected/active tab
  tablist: {
    navigate: { orientation: "horizontal", loop: true, entry: "selected" },
    select: { mode: "single", followFocus: true, disallowEmpty: true },
    activate: { mode: "automatic" },
    tab: { behavior: "escape" },
  },

  // ─── Toolbar (ARIA APG: Toolbar Pattern) ───
  // Spec: horizontal, optional loop (we enable), no selection,
  //       Tab re-enters at last focused control.
  //       button items: Space/Enter → OS_ACTIVATE (same as Enter global keybinding).
  toolbar: {
    navigate: { orientation: "horizontal", loop: true, entry: "restore" },
    select: { mode: "none" },
    action: { commands: [OS_ACTIVATE()], keys: ["Space", "Enter"] },
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
      orientation: "both",
      loop: false,
      onRight: ["expand", "enterChild"],
      onLeft: ["collapse", "goParent"],
    },
    select: { mode: "multiple", range: true, toggle: true, followFocus: false },
    activate: { mode: "manual" },
    action: { commands: [OS_EXPAND({ action: "toggle" })], keys: ["Enter"], onClick: true },
    expand: { mode: "explicit" },
    tab: { behavior: "escape" },
  },

  // ─── Tree (ARIA APG: Tree View Pattern) ───
  // vertical, no wrap, selection explicit (Enter/Space),
  // entry to selected node, typeahead (IME-safe via keyCode 229 guard)
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
    activate: { mode: "manual", onClick: true },
    action: { commands: [OS_EXPAND({ action: "toggle" })], keys: ["Enter"], onClick: true },
    expand: { mode: "explicit" },
    tab: { behavior: "escape" },
  },

  // ─── Dialog (ARIA APG: Dialog Pattern) ───
  // Spec: focus trap, autoFocus first focusable, Escape closes,
  //       Tab cycles within dialog
  dialog: {
    navigate: { orientation: "vertical", loop: false },
    tab: { behavior: "trap", restoreFocus: true },
    activate: { onClick: true },
    dismiss: { escape: "close", outsideClick: "close", restoreFocus: true },
    project: { autoFocus: true },
  },

  // ─── Alert Dialog (ARIA APG: Alert Dialog Pattern) ───
  // Spec: like dialog but more restrictive — no outside click dismiss,
  //       user must explicitly acknowledge
  alertdialog: {
    navigate: { orientation: "vertical", loop: false },
    tab: { behavior: "trap", restoreFocus: true },
    activate: { onClick: true },
    dismiss: { escape: "close", outsideClick: "none", restoreFocus: true },
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
  // Spec: vertical infinite scroll, no wrap, articles are items,
  //       PageDown/PageUp for pagination
  feed: {
    navigate: { orientation: "vertical", loop: false },
    tab: { behavior: "escape" },
  },

  // ─── Accordion (ARIA: disclosure group) ───
  // Spec: vertical, no wrap, activation toggles expand/collapse,
  //       single or multiple panels open
  accordion: {
    navigate: { orientation: "vertical", loop: false },
    activate: { mode: "manual", onClick: true },
    action: { commands: [OS_EXPAND({ action: "toggle" })] },
    expand: { mode: "all" },
    tab: { behavior: "native" },
  },

  // ─── Disclosure (ARIA: single expand/collapse) ───
  // Spec: activation toggles visibility of associated content,
  //       no navigation within — just a toggle trigger
  disclosure: {
    activate: { mode: "manual", onClick: true },
    action: { commands: [OS_EXPAND({ action: "toggle" })] },
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
  //       select.mode="none" so mousedown doesn't interfere with toggle;
  //       onCheck (Space/Enter) and onAction (click) handle toggling.
  switch: {
    select: { mode: "none" },
    action: { commands: [OS_CHECK()], keys: ["Space", "Enter"], onClick: true },
    activate: { mode: "manual", onClick: true },
    tab: { behavior: "escape" },
  },

  // ─── Checkbox (ARIA APG: Checkbox Pattern) ───
  // Spec: on/off toggle, Space toggles aria-checked, Enter does not.
  //       single focusable element, click also toggles.
  //       select.mode="none" so mousedown doesn't interfere with toggle.
  checkbox: {
    select: { mode: "none" },
    action: { commands: [OS_CHECK()] },
    activate: { mode: "manual", onClick: true },
    tab: { behavior: "escape" },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Resolver
// ═══════════════════════════════════════════════════════════════════

export function resolveRole(
  role: ZoneRole | string | undefined,
  overrides: {
    navigate?: Partial<NavigateConfig>;
    tab?: Partial<TabConfig>;
    select?: Partial<SelectConfig>;
    activate?: Partial<ActivateConfig>;
    dismiss?: Partial<DismissConfig>;
    project?: Partial<ProjectConfig>;
    expand?: Partial<ExpandConfig>;
    value?: Partial<ValueConfig>;
    action?: Partial<ActionConfig>;
  } = {},
): FocusGroupConfig {
  const basePreset = role ? rolePresets[role as ZoneRole] || {} : {};

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
    activate: {
      ...DEFAULT_ACTIVATE,
      ...basePreset.activate,
      ...(overrides.activate ?? {}),
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
    action: (() => {
      const merged = {
        ...DEFAULT_ACTION,
        ...basePreset.action,
        ...(overrides.action ?? {}),
      } as ActionConfig;
      // Auto-derive keys from first command type if not explicitly set
      if (!merged.keys && merged.commands.length > 0) {
        merged.keys = getDefaultKeysForCommand(merged.commands[0]?.type);
      }
      // Auto-derive onClick from first command type if not explicitly set
      if (merged.onClick === undefined && merged.commands.length > 0) {
        merged.onClick = getDefaultOnClickForCommand(merged.commands[0]?.type);
      }
      return merged;
    })(),
  };
}

// ═══════════════════════════════════════════════════════════════════
// Action Config Helpers (exported for use across packages)
// ═══════════════════════════════════════════════════════════════════

/**
 * Derive default keys from first command type.
 * Spec: OS_CHECK/OS_PRESS → ["Space"], OS_EXPAND/OS_ACTIVATE → ["Space","Enter"]
 */
function getDefaultKeysForCommand(
  cmdType: string | undefined,
): ActionKey[] {
  switch (cmdType) {
    case "OS_CHECK":
    case "OS_PRESS":
      return ["Space"];
    case "OS_EXPAND":
    case "OS_ACTIVATE":
      return ["Space", "Enter"];
    case "OS_OVERLAY_OPEN":
      return ["Space", "Enter", "ArrowDown"];
    default:
      return [];
  }
}

/**
 * Derive default onClick behavior from action command type.
 * OS_CHECK/OS_PRESS/OS_EXPAND are toggle commands → click should trigger them.
 * v10: used by PointerListener and simulate to read action config.
 */
export function getDefaultOnClickForCommand(
  cmdType: string | undefined,
): boolean {
  switch (cmdType) {
    case "OS_CHECK":
    case "OS_PRESS":
    case "OS_EXPAND":
      return true;
    default:
      return false;
  }
}
