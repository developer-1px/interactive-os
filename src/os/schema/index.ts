/**
 * OS Schema — Barrel Export
 */
export type { OSState } from "./OSState";
export { INITIAL_OS_STATE } from "./OSState";

export type { FocusState, ZoneSnapshot } from "./focus";

export type {
  EffectRecord,
  EffectSource,
  FocusEffectAction,
  InputSource,
} from "./effects";
export { createFocusEffect } from "./effects";

export type {
  Transaction,
  TransactionInput,
  TransactionCommand,
  StateDiff,
} from "./transaction";
export { computeDiff } from "./transaction";
