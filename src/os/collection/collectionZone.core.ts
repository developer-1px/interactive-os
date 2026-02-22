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
}

// ═══════════════════════════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════════════════════════

interface SharedCollectionConfig<S, T extends { id: string }> {
  extractId?: (focusId: string) => string;
  generateId?: () => string;
  onClone?: (original: T, newId: string) => T;
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
