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
  /** Whether the focused item is expandable (has children in tree) */
  isExpandable: boolean;
  /** Whether the focused item is disabled */
  isDisabled: boolean;
  /** Tree nesting level (1-based), undefined if not a tree */
  treeLevel: number | undefined;
}

/** Zone callback: receives cursor, returns command(s) for OS to dispatch */
export type ZoneCallback = (cursor: ZoneCursor) => BaseCommand | BaseCommand[];

export interface ZoneEntry {
  config: FocusGroupConfig;
  /** DOM element — only available in browser, null in headless */
  element?: HTMLElement | null;
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
  /**
   * Item accessor — returns ordered item IDs for this zone.
   *
   * Used by applyFocusPop for stale focus detection (Lazy Resolution).
   * When the stored focusedItemId no longer exists in the returned list,
   * the OS automatically resolves to the nearest neighbor.
   *
   * Registered by createCollectionZone (from ops.getItems) or manually
   * via createOsPage.setItems.
   */
  getItems?: () => string[];
  /** Expandable item accessor — returns IDs of items that have aria-expanded */
  getExpandableItems?: () => Set<string>;
  /** Tree level accessor — returns map of item ID → nesting level (1-based) */
  getTreeLevels?: () => Map<string, number>;
  /** Drag reorder callback — invoked by OS_DRAG_END when an item is dropped */
  onReorder?: (info: { itemId: string; overItemId: string; position: "before" | "after" }) => void;
}

const registry = new Map<string, ZoneEntry>();
const registryOrder: string[] = []; // Registration order for headless zone ordering
const disabledItems = new Map<string, Set<string>>();
const itemCallbacks = new Map<string, Map<string, ItemCallbacks>>();

/** Per-item callbacks — registered by FocusItem, read by OS commands */
export interface ItemCallbacks {
  onActivate?: BaseCommand;
}

export const ZoneRegistry = {
  register(id: string, entry: ZoneEntry): void {
    if (!registry.has(id)) registryOrder.push(id);
    registry.set(id, entry);
  },

  unregister(id: string): void {
    registry.delete(id);
    const idx = registryOrder.indexOf(id);
    if (idx !== -1) registryOrder.splice(idx, 1);
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

  /** Zone IDs in registration order (for headless zone ordering) */
  orderedKeys(): readonly string[] {
    return registryOrder;
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

