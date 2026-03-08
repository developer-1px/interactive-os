/**
 * OS Facade — Public API for application code.
 *
 * Apps MUST import from this module, not from @os-core/* directly.
 * This is the single entry point for OS primitives in application code.
 */

// ── DOM Queries (OS reads DOM so apps don't have to) ──
export {
  findItemElement,
  getAncestorWithAttribute,
  getFirstDescendantWithAttribute,
  getItemAttribute,
} from "@os-core/3-inject/itemQueries";
export { OS_ACTIVATE } from "@os-core/4-command/activate/activate";
export { OS_CHECK } from "@os-core/4-command/activate/check";
export { OS_PRESS } from "@os-core/4-command/activate/press";
export { OS_ESCAPE } from "@os-core/4-command/dismiss/escape";
export { OS_EXPAND } from "@os-core/4-command/expand";
export { OS_FIELD_START_EDIT } from "@os-core/4-command/field/field";
export { OS_FOCUS } from "@os-core/4-command/focus/focus";
export { OS_NAVIGATE } from "@os-core/4-command/navigate";
// ── OS Commands (factories) ──
export {
  OS_OVERLAY_CLOSE,
  OS_OVERLAY_OPEN,
} from "@os-core/4-command/overlay/overlay";
export { OS_SELECTION_CLEAR } from "@os-core/4-command/selection/selection";
export { OS_NOTIFY, OS_NOTIFY_DISMISS } from "@os-core/4-command/toast/toast";
export { OS_VALUE_CHANGE } from "@os-core/4-command/valueChange";
export type { AppState } from "@os-core/engine/kernel";
// ── Kernel singleton ──
export { os } from "@os-core/engine/kernel";

// ── Keybindings — INTERNAL ──
// Apps register keybindings via command({ key }), not via Keybindings directly.
// The registry is an OS internal used by resolveKeyboard and defineApp.

// ── Chain Resolution ──
export { NOOP } from "@os-core/2-resolve/chainResolver";
export type {
  ZoneCallback,
  ZoneCursor,
} from "@os-core/engine/registries/zoneRegistry";

// ── Types ──
export type { NotificationEntry } from "@os-core/schema/state/OSState";
// ── State utilities ──
export { ensureZone } from "@os-core/schema/state/utils";
export type { FieldCommandFactory } from "@os-core/schema/types/command/BaseCommand";
