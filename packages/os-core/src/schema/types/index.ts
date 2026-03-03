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
export type { ActivateConfig } from "./focus/config/FocusActivateConfig.ts";
export { DEFAULT_ACTIVATE } from "./focus/config/FocusActivateConfig.ts";
export type { DismissConfig } from "./focus/config/FocusDismissConfig.ts";
export { DEFAULT_DISMISS } from "./focus/config/FocusDismissConfig.ts";
export type {
  CheckConfig,
  ExpandConfig,
  FocusGroupConfig,
} from "./focus/config/FocusGroupConfig.ts";
export {
  DEFAULT_CHECK,
  DEFAULT_CONFIG,
  DEFAULT_EXPAND,
} from "./focus/config/FocusGroupConfig.ts";
export type {
  NavigateConfig,
  NavigateEntry,
} from "./focus/config/FocusNavigateConfig.ts";
export { DEFAULT_NAVIGATE } from "./focus/config/FocusNavigateConfig.ts";
export type { ProjectConfig } from "./focus/config/FocusProjectConfig.ts";
export { DEFAULT_PROJECT } from "./focus/config/FocusProjectConfig.ts";
export type { SelectConfig } from "./focus/config/FocusSelectConfig.ts";
export { DEFAULT_SELECT } from "./focus/config/FocusSelectConfig.ts";
export type { TabConfig } from "./focus/config/FocusTabConfig.ts";
export { DEFAULT_TAB } from "./focus/config/FocusTabConfig.ts";
export type { ValueConfig } from "./focus/config/FocusValueConfig.ts";
export { DEFAULT_VALUE } from "./focus/config/FocusValueConfig.ts";
// ── Focus domain ──
export type {
  Direction,
  Orientation,
  TabDirection,
} from "./focus/FocusDirection.ts";
export type { FocusTarget } from "./focus/FocusTarget.ts";
// ── Keyboard domain ──
export type { KeybindingItem } from "./keyboard/KeybindingItem.ts";
