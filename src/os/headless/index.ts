/**
 * Headless — barrel re-export.
 *
 * All existing `from "@os/headless"` imports continue to work.
 */

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
