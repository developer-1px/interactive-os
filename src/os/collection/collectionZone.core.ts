/**
 * collectionZone.core — Types, config, ops, and utilities for createCollectionZone.
 */

import type { CommandFactory } from "@kernel/core/tokens";
import type { ZoneHandle } from "@/os/defineApp.types";

// ═══════════════════════════════════════════════════════════════════
// Internal Item Ops — unified mutation interface
// ═══════════════════════════════════════════════════════════════════

export interface ItemOps<S, T extends { id: string }> {
  /** Get ordered array of items (read-only snapshot) */
  getItems: (state: S) => T[];
  /** Remove item by id from draft */
  removeItem: (draft: S, id: string) => void;
  /** Swap two adjacent items in draft by their ids */
  swapItems: (draft: S, idA: string, idB: string) => void;
  /** Insert item after a given index in draft */
  insertAfter: (draft: S, index: number, item: T) => void;
  /** Optional: get siblings of an item (for tree-aware move). When present, makeMoveCommand uses this instead of flat getItems for neighbor lookup. */
  getSiblings?: (state: S, id: string) => T[];
}

// ═══════════════════════════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════════════════════════

interface SharedCollectionConfig<S, T extends { id: string }> {
  extractId?: (focusId: string) => string;
  generateId?: () => string;
  onClone?: (original: T, newId: string) => T;
  /** Factory to create a new entity. Return null to reject (no-op). */
  create?: (payload: any, state: S) => T | null;
  /** Optional visibility filter for moveUp/moveDown. Items not matching are skipped. */
  filter?: (state: S) => (item: T) => boolean;
  /** Serialize item to text for native clipboard. Default: item.label ?? item.text ?? item.id */
  text?: (item: T) => string;
  /** Validate incoming paste data from a different collection. Default: same-source auto-accept. */
  accept?: (data: unknown) => T | null;
  /** Transform item on paste. E.g., assign current category or context. */
  onPaste?: (item: T, state: S) => T;
}

/** Array-based config: single accessor to T[] */
export interface ArrayCollectionConfig<S, T extends { id: string }>
  extends SharedCollectionConfig<S, T> {
  accessor: (state: S) => T[];
}

/** Entity+Order config: produced by fromEntities() */
export interface EntityCollectionConfig<S, T extends { id: string }>
  extends SharedCollectionConfig<S, T> {
  _ops: ItemOps<S, T>;
}

export type CollectionConfig<S, T extends { id: string } = any> =
  | ArrayCollectionConfig<S, T>
  | EntityCollectionConfig<S, T>;

// ═══════════════════════════════════════════════════════════════════
// Handle
// ═══════════════════════════════════════════════════════════════════

export interface CollectionZoneHandle<S> extends ZoneHandle<S> {
  /** Canonical zone ID — use for <Zone id={}> in DOM. Single source of truth. */
  readonly zoneId: string;
  /** Add a new entity using the create factory. Only available if `create` is configured. */
  add: CommandFactory<string, any> | undefined;
  remove: CommandFactory<string, { id: string }>;
  moveUp: CommandFactory<string, { id: string }>;
  moveDown: CommandFactory<string, { id: string }>;
  move: CommandFactory<
    string,
    { id: string; toParentId?: string; afterId?: string }
  >;
  duplicate: CommandFactory<string, { id: string }>;
  copy: CommandFactory<string, { ids: string[] }>;
  cut: CommandFactory<string, { ids: string[]; focusId?: string }>;
  paste: CommandFactory<string, { afterId?: string }>;
  /** Write text to the global clipboard store (for non-structural copies). */
  copyText: (text: string) => void;
  /** Read the first item from the clipboard store. */
  readClipboard: () => unknown | null;
  /** Remove entity by id directly from an Immer draft. Use in custom commands. */
  removeFromDraft: (draft: S, id: string) => void;
  collectionBindings(
    options?: CollectionBindingsOptions,
  ): CollectionBindingsResult;
}

export interface CollectionBindingsOptions {
  /** Guard predicate: if returns false, the callback becomes no-op (returns []). */
  guard?: (cursor: { focusId: string; selection: string[] }) => boolean;
}

export interface CollectionBindingsResult {
  onDelete: (cursor: { focusId: string; selection: string[] }) => any;
  onMoveUp: (cursor: { focusId: string; selection: string[] }) => any;
  onMoveDown: (cursor: { focusId: string; selection: string[] }) => any;
  onCopy: (cursor: { focusId: string; selection: string[] }) => any;
  onCut: (cursor: { focusId: string; selection: string[] }) => any;
  onPaste: (cursor: { focusId: string; selection: string[] }) => any;
  keybindings: Array<{
    key: string;
    command: (cursor: { focusId: string; selection: string[] }) => any;
  }>;
  /** Item accessor — returns ordered item IDs for stale focus recovery */
  getItems: () => string[];
}

// ═══════════════════════════════════════════════════════════════════
// Config guards and factories
// ═══════════════════════════════════════════════════════════════════

export function isEntityConfig<S, T extends { id: string }>(
  c: CollectionConfig<S, T>,
): c is EntityCollectionConfig<S, T> {
  return "_ops" in c;
}

export function opsFromAccessor<S, T extends { id: string }>(
  accessor: (state: S) => T[],
): ItemOps<S, T> {
  return {
    getItems: (state) => accessor(state),
    removeItem: (draft, id) => {
      const arr = accessor(draft);
      const idx = arr.findIndex((item) => item.id === id);
      if (idx !== -1) arr.splice(idx, 1);
    },
    swapItems: (draft, idA, idB) => {
      const arr = accessor(draft);
      const iA = arr.findIndex((item) => item.id === idA);
      const iB = arr.findIndex((item) => item.id === idB);
      if (iA !== -1 && iB !== -1) {
        [arr[iA], arr[iB]] = [arr[iB]!, arr[iA]!];
      }
    },
    insertAfter: (draft, index, item) => {
      accessor(draft).splice(index + 1, 0, item);
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// Defaults
// ═══════════════════════════════════════════════════════════════════

export const defaultGenerateId = () => Math.random().toString(36).slice(2, 10);

/** Default text serializer: tries label, text, then id. */
export function defaultToText(item: any): string {
  return item.label ?? item.text ?? item.id ?? "";
}

/** Auto deep clone: recursively regenerate IDs for items with children. */
export function autoDeepClone<T extends { id: string }>(
  item: T,
  newId: string,
  uid: () => string,
): T {
  const cloned: any = { ...item, id: newId };
  if (Object.hasOwn(item, "fields")) {
    cloned.fields = { ...(item as any).fields };
  }
  if (Array.isArray((item as any).children)) {
    cloned.children = (item as any).children.map((child: any) =>
      autoDeepClone(child, uid(), uid),
    );
  }
  return cloned as T;
}

// ═══════════════════════════════════════════════════════════════════
// fromEntities — Entity+Order preset
// ═══════════════════════════════════════════════════════════════════

/**
 * fromEntities — Adapter for entity-map + order-array collections.
 *
 * Produces an _ops interface that works directly on the entity map
 * and order array. No intermediate normalize/denormalize.
 */
export function fromEntities<S, T extends { id: string }>(
  entitiesAccessor: (state: S) => Record<string, T>,
  orderAccessor: (state: S) => string[],
): { _ops: ItemOps<S, T> } {
  return {
    _ops: {
      getItems: (state) => {
        const entities = entitiesAccessor(state);
        return orderAccessor(state)
          .map((id) => entities[id]!)
          .filter(Boolean);
      },
      removeItem: (draft, id) => {
        delete entitiesAccessor(draft)[id];
        const order = orderAccessor(draft);
        const idx = order.indexOf(id);
        if (idx !== -1) order.splice(idx, 1);
      },
      swapItems: (draft, idA, idB) => {
        const order = orderAccessor(draft);
        const iA = order.indexOf(idA);
        const iB = order.indexOf(idB);
        if (iA !== -1 && iB !== -1) {
          [order[iA], order[iB]] = [order[iB]!, order[iA]!];
        }
        // entities don't need swapping — only order matters
      },
      insertAfter: (draft, index, item) => {
        entitiesAccessor(draft)[item.id] = item;
        orderAccessor(draft).splice(index + 1, 0, item.id);
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// fromNormalized — Tree-aware Entity+Order preset
// ═══════════════════════════════════════════════════════════════════

/**
 * fromNormalized — Adapter for entity-map + adjacency-list order.
 *
 * Unlike fromEntities (flat string[]), this handles
 * Record<string, string[]> where "" = root items and
 * parentId = children of that parent.
 *
 * Produces tree-aware ItemOps:
 *  - getItems: DFS flattening
 *  - removeItem: recursive children deletion
 *  - swapItems: same-parent sibling swap
 *  - insertAfter: parent-aware insertion
 */
export function fromNormalized<S, T extends { id: string }>(
  entitiesAccessor: (state: S) => Record<string, T>,
  orderAccessor: (state: S) => Record<string, string[]>,
): { _ops: ItemOps<S, T> } {
  /** Find parent key for a given id */
  function findParent(
    order: Record<string, string[]>,
    id: string,
  ): string | undefined {
    for (const [parentId, children] of Object.entries(order)) {
      if (children.includes(id)) return parentId;
    }
    return undefined;
  }

  /** DFS flatten: root → children recursively */
  function dfs(order: Record<string, string[]>, parentId: string): string[] {
    const result: string[] = [];
    for (const id of order[parentId] ?? []) {
      result.push(id);
      result.push(...dfs(order, id));
    }
    return result;
  }

  /** Collect id + all descendants */
  function collectDescendants(
    order: Record<string, string[]>,
    id: string,
  ): Set<string> {
    const set = new Set<string>();
    const walk = (targetId: string) => {
      set.add(targetId);
      for (const childId of order[targetId] ?? []) walk(childId);
    };
    walk(id);
    return set;
  }

  return {
    _ops: {
      getItems: (state) => {
        const entities = entitiesAccessor(state);
        const order = orderAccessor(state);
        return dfs(order, "")
          .map((id) => entities[id]!)
          .filter(Boolean);
      },

      removeItem: (draft, id) => {
        const entities = entitiesAccessor(draft);
        const order = orderAccessor(draft);
        const toRemove = collectDescendants(order, id);

        // Remove from entities
        for (const rid of toRemove) delete entities[rid];

        // Remove children lists for removed parents
        for (const rid of toRemove) delete order[rid];

        // Remove from parent's children
        for (const children of Object.values(order)) {
          const idx = children.indexOf(id);
          if (idx !== -1) {
            children.splice(idx, 1);
            break;
          }
        }
      },

      swapItems: (draft, idA, idB) => {
        const order = orderAccessor(draft);
        // Find parent that contains both (must be same parent for sibling swap)
        const parentA = findParent(order, idA);
        const parentB = findParent(order, idB);
        if (parentA == null || parentA !== parentB) return;

        const siblings = order[parentA]!;
        const iA = siblings.indexOf(idA);
        const iB = siblings.indexOf(idB);
        if (iA !== -1 && iB !== -1) {
          [siblings[iA], siblings[iB]] = [siblings[iB]!, siblings[iA]!];
        }
      },

      insertAfter: (draft, index, item) => {
        const entities = entitiesAccessor(draft);
        const order = orderAccessor(draft);
        entities[item.id] = item;

        // Find the item at 'index' in DFS order to determine parent
        const allItems = dfs(order, "");
        const afterId = allItems[index];
        if (afterId == null) {
          // Append to root
          (order[""] ??= []).push(item.id);
          return;
        }

        const parent = findParent(order, afterId);
        if (parent == null) {
          // afterId not found, append to root
          (order[""] ??= []).push(item.id);
          return;
        }

        const siblings = order[parent]!;
        const afterIdx = siblings.indexOf(afterId);
        siblings.splice(afterIdx + 1, 0, item.id);
      },

      getSiblings: (state, id) => {
        const entities = entitiesAccessor(state);
        const order = orderAccessor(state);
        const parent = findParent(order, id);
        if (parent == null) return [];
        return (order[parent] ?? [])
          .map((sid) => entities[sid]!)
          .filter(Boolean);
      },
    },
  };
}
