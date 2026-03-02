/**
 * Headless — barrel re-export.
 *
 * All existing `from "@os/core/library/headless"` imports continue to work.
 */

// Compute (used by Item.tsx + tests)
export {
  computeAttrs,
  computeItem,
  readActiveZoneId,
  readFocusedItemId,
  readSelection,
  resolveElement,
} from "./compute";
// Simulate (used by tests only)
export {
  type HeadlessZoneOptions,
  registerHeadlessZone,
  setInteractionObserver,
  simulateClick,
  simulateKeyPress,
  unregisterHeadlessZone,
} from "./simulate";
// Types
export type {
  ElementAttrs,
  HeadlessKernel,
  InteractionObserver,
  InteractionRecord,
  ItemAttrs,
  ItemOverrides,
  ItemResult,
  ItemState,
} from "./types";
