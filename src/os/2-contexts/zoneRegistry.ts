/**
 * ZoneRegistry — Runtime registry for mounted Zones.
 *
 * Maps zone IDs to their config + DOM element reference.
 * Context providers use this to resolve zone-specific data.
 *
 * Lifecycle:
 *   Zone mount  → ZoneRegistry.register(id, config, element)
 *   Zone unmount → ZoneRegistry.unregister(id)
 */

import type { BaseCommand } from "@kernel";
import type { ZoneRole } from "../registries/roleRegistry";
import type { FocusGroupConfig } from "../schemas/focus/config/FocusGroupConfig";

/**
 * ZoneCursor — OS→App interface for focus/selection context.
 *
 * OS constructs this from kernel state and passes to zone callbacks.
 * App decides how to handle based on focusId, selection, and anchor.
 */
export interface ZoneCursor {
  /** Currently focused item ID */
  focusId: string;
  /** Selected item IDs (may be empty) */
  selection: string[];
  /** Selection anchor (starting point of range selection) */
  anchor: string | null;
}

/** Zone callback: receives cursor, returns command(s) for OS to dispatch */
export type ZoneCallback = (cursor: ZoneCursor) => BaseCommand | BaseCommand[];

export interface ZoneEntry {
  config: FocusGroupConfig;
  element: HTMLElement;
  role?: ZoneRole;
  parentId: string | null;
  /** Command dispatched on ESC when dismiss.escape is "close" */
  onDismiss?: BaseCommand;
  /**
   * Dynamic item filter — determines which items are keyboard-navigable.
   *
   * Called by DOM_ITEMS/DOM_RECTS context providers on every interaction.
   * Enables runtime filtering (level-based, search results, etc.)
   *
   * @param items - All item IDs in DOM order
   * @returns Subset of items that should be navigable right now
   */
  itemFilter?: (items: string[]) => string[];
  // Cursor-based callbacks — app receives full focus/selection context
  onAction?: ZoneCallback;
  onSelect?: ZoneCallback;
  onCheck?: ZoneCallback;
  onDelete?: ZoneCallback;
  onMoveUp?: ZoneCallback;
  onMoveDown?: ZoneCallback;
  onCopy?: ZoneCallback;
  onCut?: ZoneCallback;
  onPaste?: ZoneCallback;
  // Static commands — no cursor needed
  onUndo?: BaseCommand;
  onRedo?: BaseCommand;
}

const registry = new Map<string, ZoneEntry>();
const disabledItems = new Map<string, Set<string>>();
const itemCallbacks = new Map<string, Map<string, ItemCallbacks>>();

/** Per-item callbacks — registered by FocusItem, read by OS commands */
export interface ItemCallbacks {
  onActivate?: BaseCommand;
}

export const ZoneRegistry = {
  register(id: string, entry: ZoneEntry): void {
    registry.set(id, entry);
  },

  unregister(id: string): void {
    registry.delete(id);
    disabledItems.delete(id);
    itemCallbacks.delete(id);
  },

  get(id: string): ZoneEntry | undefined {
    return registry.get(id);
  },

  has(id: string): boolean {
    return registry.has(id);
  },

  /** Get all registered zone IDs */
  keys(): IterableIterator<string> {
    return registry.keys();
  },

  // ─── Per-item disabled state (declaration, not action) ───

  setDisabled(zoneId: string, itemId: string, disabled: boolean): void {
    if (disabled) {
      let set = disabledItems.get(zoneId);
      if (!set) {
        set = new Set();
        disabledItems.set(zoneId, set);
      }
      set.add(itemId);
    } else {
      disabledItems.get(zoneId)?.delete(itemId);
    }
  },

  isDisabled(zoneId: string, itemId: string): boolean {
    return disabledItems.get(zoneId)?.has(itemId) ?? false;
  },

  getDisabledItems(zoneId: string): ReadonlySet<string> {
    return disabledItems.get(zoneId) ?? EMPTY_SET;
  },

  // ─── Per-item callbacks (e.g. Trigger.onActivate) ───

  setItemCallback(zoneId: string, itemId: string, callbacks: ItemCallbacks): void {
    let zone = itemCallbacks.get(zoneId);
    if (!zone) {
      zone = new Map();
      itemCallbacks.set(zoneId, zone);
    }
    zone.set(itemId, callbacks);
  },

  clearItemCallback(zoneId: string, itemId: string): void {
    itemCallbacks.get(zoneId)?.delete(itemId);
  },

  getItemCallback(zoneId: string, itemId: string): ItemCallbacks | undefined {
    return itemCallbacks.get(zoneId)?.get(itemId);
  },
};

const EMPTY_SET: ReadonlySet<string> = new Set();

