/**
 * Schema barrel export
 *
 * Re-exports all schema types from their canonical locations
 * in the domain-organized folder structure.
 */

// ── Command domain ──
export type { BaseCommand } from "@kernel";
export type { FieldCommandFactory } from "./command/BaseCommand.ts";
export type {
  OSActivatePayload,
  OSCommandUnion,
  OSFocusPayload,
  OSNavigatePayload,
  OSSelectPayload,
} from "./command/OSCommandPayload.ts";
export type { OSCommandType } from "./command/OSCommands.ts";
export { OS_COMMANDS } from "./command/OSCommands.ts";
// ── Focus config ──
export type {
  DismissConfig,
  ExpandConfig,
  FocusGroupConfig,
  InputMap,
  NavigateConfig,
  NavigateEntry,
  ProjectConfig,
  SelectConfig,
  TabConfig,
  ValueConfig,
} from "./focus/config/FocusGroupConfig.ts";
export {
  DEFAULT_CONFIG,
  DEFAULT_DISMISS,
  DEFAULT_EXPAND,
  DEFAULT_INPUTMAP,
  DEFAULT_NAVIGATE,
  DEFAULT_PROJECT,
  DEFAULT_SELECT,
  DEFAULT_TAB,
  DEFAULT_VALUE,
} from "./focus/config/FocusGroupConfig.ts";
// ── Focus domain ──
export type {
  Direction,
  Orientation,
  TabDirection,
} from "./focus/FocusDirection.ts";
export type { FocusTarget } from "./focus/FocusTarget.ts";
// ── Keyboard domain ──
export type { KeybindingItem } from "./keyboard/KeybindingItem.ts";
