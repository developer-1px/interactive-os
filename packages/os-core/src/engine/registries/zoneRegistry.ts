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
import type { FocusGroupConfig } from "../../schema/types/focus/config/FocusGroupConfig";
import type { ZoneRole } from "./roleRegistry";

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
  /** FieldRegistry ID — set by headless setupZone() for field-aware zones */
  fieldId?: string | null;
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
  onReorder?: (info: {
    itemId: string;
    overItemId: string;
    position: "before" | "after";
  }) => BaseCommand | BaseCommand[];
  /** Label accessor — returns map of item ID → display label for typeahead */
  getLabels?: () => Map<string, string>;
}

const registry = new Map<string, ZoneEntry>();
const registryOrder: string[] = []; // Registration order for headless zone ordering
const disabledItems = new Map<string, Set<string>>();
const itemCallbacks = new Map<string, Map<string, ItemCallbacks>>();

// ─── Zone mount/unmount observer (for TestBotRegistry, etc.) ───
const listeners = new Set<() => void>();
let zoneSnapshot: readonly string[] = [];
let notifyScheduled = false;

function rebuildSnapshot() {
  zoneSnapshot = [...registry.keys()];
}

/**
 * Deferred notification — uses queueMicrotask to avoid triggering
 * subscriber setState during another component's render phase.
 * (Zone.tsx calls register() inside useMemo = render phase.)
 * Deduped: multiple register/unregister in the same microtask = 1 notify.
 */
function notifyListeners() {
  if (notifyScheduled) return;
  notifyScheduled = true;
  queueMicrotask(() => {
    notifyScheduled = false;
    rebuildSnapshot();
    for (const fn of listeners) fn();
  });
}

/** Per-item callbacks — registered by FocusItem, read by OS commands */
export interface ItemCallbacks {
  onActivate?: BaseCommand;
}

export const ZoneRegistry = {
  register(id: string, entry: ZoneEntry): void {
    const isNew = !registry.has(id);
    if (isNew) registryOrder.push(id);
    registry.set(id, entry);
    if (isNew) notifyListeners();
  },

  unregister(id: string): void {
    const existed = registry.has(id);
    registry.delete(id);
    const idx = registryOrder.indexOf(id);
    if (idx !== -1) registryOrder.splice(idx, 1);
    disabledItems.delete(id);
    itemCallbacks.delete(id);
    if (existed) notifyListeners();
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

  /** Clear all registrations (for test isolation) */
  clearAll(): void {
    registry.clear();
    registryOrder.length = 0;
    disabledItems.clear();
    itemCallbacks.clear();
  },

  /**
   * Subscribe to zone mount/unmount events.
   * Returns an unsubscribe function. useSyncExternalStore compatible.
   */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Snapshot of currently registered zone IDs. Stable reference until zones change. */
  getSnapshot(): readonly string[] {
    return zoneSnapshot;
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

  setItemCallback(
    zoneId: string,
    itemId: string,
    callbacks: ItemCallbacks,
  ): void {
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

  /**
   * Bind a DOM element to a registered zone.
   *
   * When the zone has no explicit getItems/getLabels, auto-creates
   * DOM-scanning closures. This moves DOM discovery strategy from
   * the React layer (FocusGroup Phase 2) into OS ownership.
   *
   * Called by FocusGroup useLayoutEffect — the only DOM touch point.
   */
  bindElement(id: string, element: HTMLElement): void {
    const entry = registry.get(id);
    if (!entry) return;

    const patch: Partial<ZoneEntry> = { element };

    // Auto-register DOM-scanning getItems when no explicit accessor
    if (!entry.getItems) {
      patch.getItems = () => {
        const items: string[] = [];
        const els = element.querySelectorAll("[data-item]");
        for (const child of els) {
          if (child.closest("[data-zone]") !== element) continue;
          const itemId = child.id;
          if (itemId) items.push(itemId);
        }
        return items;
      };
    }

    // Auto-register DOM-scanning getLabels for typeahead
    if (!entry.getLabels) {
      patch.getLabels = () => {
        const labels = new Map<string, string>();
        const els = element.querySelectorAll<HTMLElement>("[data-item]");
        for (const child of els) {
          if (child.closest("[data-zone]") !== element) continue;
          const itemId = child.id;
          if (itemId) {
            const label =
              child.getAttribute("aria-label") || child.textContent || "";
            labels.set(itemId, label.trim());
          }
        }
        return labels;
      };
    }

    registry.set(id, { ...entry, ...patch });
  },

  /** Find which zone contains this item (searches all zones) */
  findZoneByItemId(itemId: string): string | null {
    for (const [zoneId, entry] of registry) {
      if (entry.fieldId === itemId) return zoneId;
      const items = entry.getItems?.();
      if (items?.includes(itemId)) return zoneId;
    }
    return null;
  },

  /** Find item callback across all zones (zone-independent lookup) */
  findItemCallback(itemId: string): ItemCallbacks | undefined {
    for (const [, zoneCallbacks] of itemCallbacks) {
      const cb = zoneCallbacks.get(itemId);
      if (cb) return cb;
    }
    return undefined;
  },

  /**
   * Resolve ordered item IDs for a zone.
   *
   * Single path: getItems() → empty array.
   * getItems is always provided: either explicitly (headless) or
   * auto-installed by bindElement (DOM). No fallback needed.
   */
  resolveItems(id: string): string[] {
    const entry = registry.get(id);
    if (!entry) return [];
    if (entry.getItems) return entry.getItems();
    return [];
  },

  /**
   * Resolve labels map for a zone (for typeahead).
   *
   * Single path: getLabels() → empty map.
   * getLabels is auto-installed by bindElement when not explicit.
   */
  resolveLabels(id: string): Map<string, string> {
    const entry = registry.get(id);
    if (!entry) return new Map();
    if (entry.getLabels) return entry.getLabels();
    return new Map();
  },

  /** Check if a specific item is expandable (config-driven). */
  isExpandable(zoneId: string, itemId: string): boolean {
    const entry = registry.get(zoneId);
    if (!entry) return false;
    const mode = entry.config?.expand?.mode ?? "none";
    if (mode === "all") return true;
    if (mode === "explicit")
      return entry.getExpandableItems?.().has(itemId) ?? false;
    return false;
  },
};

const EMPTY_SET: ReadonlySet<string> = new Set();
