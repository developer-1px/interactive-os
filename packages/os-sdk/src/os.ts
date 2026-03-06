/**
 * OS Facade — Public API for application code.
 *
 * Apps MUST import from this module, not from @os-core/* directly.
 * This is the single entry point for OS primitives in application code.
 */

// ── Kernel singleton ──
export { os } from "@os-core/engine/kernel";
export type { AppState } from "@os-core/engine/kernel";

// ── OS Commands (factories) ──
export {
    OS_OVERLAY_OPEN,
    OS_OVERLAY_CLOSE,
} from "@os-core/4-command/overlay/overlay";
export { OS_NOTIFY } from "@os-core/4-command/toast/toast";
export { OS_NOTIFY_DISMISS } from "@os-core/4-command/toast/toast";
export { OS_FOCUS } from "@os-core/4-command/focus/focus";
export { OS_ESCAPE } from "@os-core/4-command/dismiss/escape";
export { OS_NAVIGATE } from "@os-core/4-command/navigate";
export { OS_FIELD_START_EDIT } from "@os-core/4-command/field/field";
export { OS_SELECTION_CLEAR } from "@os-core/4-command/selection/selection";
export { OS_CHECK } from "@os-core/4-command/activate/check";
export { OS_PRESS } from "@os-core/4-command/activate/press";
export { OS_VALUE_CHANGE } from "@os-core/4-command/valueChange";

// ── DOM Queries (OS reads DOM so apps don't have to) ──
export {
    findItemElement,
    getItemAttribute,
    getFirstDescendantWithAttribute,
    getAncestorWithAttribute,
} from "@os-core/3-inject/itemQueries";

// ── Keybindings — INTERNAL ──
// Apps register keybindings via command({ key }), not via Keybindings directly.
// The registry is an OS internal used by resolveKeyboard and defineApp.

// ── Chain Resolution ──
export { NOOP } from "@os-core/2-resolve/chainResolver";

// ── State utilities ──
export { ensureZone } from "@os-core/schema/state/utils";

// ── Types ──
export type { NotificationEntry } from "@os-core/schema/state/OSState";
export type { FieldCommandFactory } from "@os-core/schema/types/command/BaseCommand";
export type { ZoneCursor } from "@os-core/engine/registries/zoneRegistry";
