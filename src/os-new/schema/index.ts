/**
 * Schema barrel export
 *
 * Re-exports all schema types from their canonical locations
 * in the domain-organized folder structure.
 */

// ── Focus domain ──
export type { Direction, TabDirection, Orientation } from "./focus/FocusDirection.ts";
export type { FocusIntent } from "./focus/FocusIntent.ts";
export type { FocusNode } from "./focus/FocusNode.ts";
export type { PipelineContext } from "./focus/FocusPipelineContext.ts";
export type { NavigateConfig } from "./focus/config/FocusNavigateConfig.ts";
export { DEFAULT_NAVIGATE } from "./focus/config/FocusNavigateConfig.ts";
export type { TabConfig } from "./focus/config/FocusTabConfig.ts";
export { DEFAULT_TAB } from "./focus/config/FocusTabConfig.ts";
export type { SelectConfig } from "./focus/config/FocusSelectConfig.ts";
export { DEFAULT_SELECT } from "./focus/config/FocusSelectConfig.ts";
export type { ActivateConfig } from "./focus/config/FocusActivateConfig.ts";
export { DEFAULT_ACTIVATE } from "./focus/config/FocusActivateConfig.ts";
export type { DismissConfig } from "./focus/config/FocusDismissConfig.ts";
export { DEFAULT_DISMISS } from "./focus/config/FocusDismissConfig.ts";
export type { ProjectConfig } from "./focus/config/FocusProjectConfig.ts";
export { DEFAULT_PROJECT } from "./focus/config/FocusProjectConfig.ts";
export type { FocusGroupConfig } from "./focus/config/FocusGroupConfig.ts";
export { DEFAULT_CONFIG } from "./focus/config/FocusGroupConfig.ts";
export type { ZoneSnapshot, FocusState } from "./focus/FocusState.ts";
export type { FocusTarget } from "./focus/FocusTarget.ts";

// ── Command domain ──
export type { BaseCommand, FieldCommandFactory } from "./command/BaseCommand.ts";
export { OS_COMMANDS } from "./command/OSCommands.ts";
export type { OSCommandType } from "./command/OSCommands.ts";
export type {
    OSNavigatePayload,
    OSFocusPayload,
    OSSelectPayload,
    OSActivatePayload,
    OSCommandUnion,
} from "./command/OSCommandPayload.ts";

// ── Keyboard domain ──
export type { KeybindingItem } from "./keyboard/KeybindingItem.ts";

// ── Effect domain ──
export type {
    InputSource,
    EffectSource,
    FocusEffectAction,
    EffectRecord,
} from "./effect/EffectRecord.ts";
export { createFocusEffect } from "./effect/EffectRecord.ts";

// ── State domain ──
export type { OSState } from "./state/OSState.ts";
export { INITIAL_OS_STATE } from "./state/OSState.ts";
export type {
    Transaction,
    TransactionInput,
    TransactionCommand,
    StateDiff,
} from "./state/OSTransaction.ts";
export { computeDiff } from "./state/computeOSStateDiff.ts";
export type { PersistenceAdapter } from "./state/PersistenceAdapter.ts";
export { LocalStorageAdapter } from "./state/PersistenceAdapter.ts";
