/**
 * Headless interaction utilities — re-exported from os-core.
 *
 * Canonical source: @os-core/3-inject/
 * This file maintains backward compatibility for @os-sdk/library/headless imports.
 */

export {
  computeItem,
  computeAttrs,
  readActiveZoneId,
  readFocusedItemId,
  readSelection,
  resolveElement,
} from "@os-core/3-inject/compute";

export type { ItemState } from "@os-core/3-inject/compute";

export {
  setInteractionObserver,
  simulateKeyPress,
  simulateClick,
  registerHeadlessZone,
  unregisterHeadlessZone,
} from "@os-core/3-inject/simulate";

export type { HeadlessZoneOptions } from "@os-core/3-inject/simulate";

export type {
  HeadlessKernel,
  ItemAttrs,
  ItemOverrides,
  ItemResult,
  ElementAttrs,
  InteractionRecord,
  InteractionObserver,
} from "@os-core/3-inject/headless.types";
