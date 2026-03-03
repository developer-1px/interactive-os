/**
 * Headless interaction utilities — re-exported from os-core.
 *
 * Canonical source: @os-core/3-inject/
 * This file maintains backward compatibility for @os-sdk/library/headless imports.
 */

export type { ItemState } from "@os-core/3-inject/compute";
export {
  computeAttrs,
  computeItem,
  readActiveZoneId,
  readFocusedItemId,
  readSelection,
  resolveElement,
} from "@os-core/3-inject/compute";
export type {
  ElementAttrs,
  HeadlessKernel,
  InteractionObserver,
  InteractionRecord,
  ItemAttrs,
  ItemOverrides,
  ItemResult,
} from "@os-core/3-inject/headless.types";

export type { HeadlessZoneOptions } from "@os-core/3-inject/simulate";
export {
  registerHeadlessZone,
  setInteractionObserver,
  simulateClick,
  simulateKeyPress,
  unregisterHeadlessZone,
} from "@os-core/3-inject/simulate";
