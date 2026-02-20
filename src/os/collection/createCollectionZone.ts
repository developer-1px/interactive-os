/**
 * createCollectionZone — Collection Zone Facade v2
 *
 * Wraps createZone to auto-generate CRUD + clipboard commands
 * (remove, moveUp, moveDown, duplicate, copy, cut, paste).
 *
 * v2: Clipboard is OS-managed (global single).
 * Apps only provide data location + optional overrides.
 *
 * Supports two data shapes via config:
 *   - accessor:     for T[] arrays (Builder)
 *   - fromEntities: for Record<id, T> + order[] (Todo)
 *
 * @example
 *   // Minimal — items accessor only
 *   const sidebar = createCollectionZone(BuilderApp, "sidebar", {
 *     accessor: (s) => s.data.blocks,
 *     text: (item) => item.label,
 *   });
 *
 *   // Entity+Order with paste transform
 *   const list = createCollectionZone(TodoApp, "list", {
 *     ...fromEntities((s) => s.data.todos, (s) => s.data.todoOrder),
 *     text: (item) => item.text,
 *     onPaste: (item, s) => ({ ...item, categoryId: s.ui.selectedCategoryId }),
 *   });
 */

import type { BaseCommand, CommandFactory } from "@kernel/core/tokens";
import { produce } from "immer";
import { FOCUS } from "@/os/3-commands/focus/focus";
import { OS_CLIPBOARD_SET } from "@/os/3-commands/clipboard/clipboardSet";
import type { AppHandle, ZoneHandle } from "@/os/defineApp.types";

// ═══════════════════════════════════════════════════════════════════
// Internal clipboard store — module-level, kernel-agnostic
// ═══════════════════════════════════════════════════════════════════
// Primary data channel for copy→paste. OS_CLIPBOARD_SET dispatch is
// the secondary sync channel for OS state/UI indicators.

interface ClipboardEntry {
  source: string;
  items: unknown[];
  isCut: boolean;
}

let _clipboardStore: ClipboardEntry = { source: "", items: [], isCut: false };

/** @internal Test helper: reset clipboard store between test runs */
export function _resetClipboardStore(): void {
  _clipboardStore = { source: "", items: [], isCut: false };
}

// ═══════════════════════════════════════════════════════════════════
// Internal Item Ops — unified mutation interface
// ═══════════════════════════════════════════════════════════════════

interface ItemOps<S, T extends { id: string }> {
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

// ═══════════════════════════════════════════════════════════════════
// Config — Shared fields
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
  remove: CommandFactory<string, { id: string }>;
  moveUp: CommandFactory<string, { id: string }>;
  moveDown: CommandFactory<string, { id: string }>;
  duplicate: CommandFactory<string, { id: string }>;
  copy: CommandFactory<string, { ids: string[] }>;
  cut: CommandFactory<string, { ids: string[]; focusId?: string }>;
  paste: CommandFactory<string, { afterId?: string }>;
  collectionBindings(): CollectionBindingsResult;
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
// Resolve config → ItemOps
// ═══════════════════════════════════════════════════════════════════

function isEntityConfig<S, T extends { id: string }>(
  c: CollectionConfig<S, T>,
): c is EntityCollectionConfig<S, T> {
  return "_ops" in c;
}

function opsFromAccessor<S, T extends { id: string }>(
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

const defaultGenerateId = () => Math.random().toString(36).slice(2, 10);

/** Default text serializer: tries label, text, then id. */
function defaultToText(item: any): string {
  return item.label ?? item.text ?? item.id ?? "";
}

/** Auto deep clone: recursively regenerate IDs for items with children. */
function autoDeepClone<T extends { id: string }>(item: T, newId: string, uid: () => string): T {
  const cloned: any = { ...item, id: newId };
  if (item.hasOwnProperty("fields")) {
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
// createCollectionZone
// ═══════════════════════════════════════════════════════════════════

export function createCollectionZone<S, T extends { id: string } = any>(
  app: AppHandle<S>,
  zoneName: string,
  config: CollectionConfig<S, T>,
): CollectionZoneHandle<S> {
  const zone = app.createZone(zoneName);
  const uid = config.generateId ?? defaultGenerateId;
  const toEntityId = config.extractId ?? ((id: string) => id.replace(`${zoneName}-`, ""));
  const toText = config.text ?? defaultToText;
  const clipboardSource = zoneName; // Unique per collection
  const ops: ItemOps<S, T> = isEntityConfig(config)
    ? config._ops
    : opsFromAccessor((config as ArrayCollectionConfig<S, T>).accessor);

  // ── remove ──
  const remove = zone.command(
    `${zoneName}:remove`,
    (ctx: { readonly state: S }, payload: { id: string }) => {
      const allItems = ops.getItems(ctx.state);
      // Calculate neighbor for focus recovery (using visible items)
      const visible = config.filter
        ? allItems.filter(config.filter(ctx.state))
        : allItems;
      const visIdx = visible.findIndex((item) => item.id === payload.id);

      let focusCmd: BaseCommand | undefined;
      if (visIdx !== -1) {
        const neighbor = visible[visIdx + 1] ?? visible[visIdx - 1];
        if (neighbor) {
          focusCmd = FOCUS({
            zoneId: zoneName,
            itemId: neighbor.id,
          });
        }
      }

      if (!allItems.some((item) => item.id === payload.id))
        return { state: ctx.state };
      return {
        state: produce(ctx.state, (draft) => {
          ops.removeItem(draft as S, payload.id);
        }),
        dispatch: focusCmd,
      };
    },
  );

  // ── moveUp ──
  const moveUp = zone.command(
    `${zoneName}:moveUp`,
    (ctx: { readonly state: S }, payload: { id: string }) => {
      const allItems = ops.getItems(ctx.state);
      const visible = config.filter
        ? allItems.filter(config.filter(ctx.state))
        : allItems;
      const visIdx = visible.findIndex((item) => item.id === payload.id);
      if (visIdx <= 0) return { state: ctx.state };
      return {
        state: produce(ctx.state, (draft) => {
          ops.swapItems(draft as S, payload.id, visible[visIdx - 1]!.id);
        }),
      };
    },
  );

  // ── moveDown ──
  const moveDown = zone.command(
    `${zoneName}:moveDown`,
    (ctx: { readonly state: S }, payload: { id: string }) => {
      const allItems = ops.getItems(ctx.state);
      const visible = config.filter
        ? allItems.filter(config.filter(ctx.state))
        : allItems;
      const visIdx = visible.findIndex((item) => item.id === payload.id);
      if (visIdx === -1 || visIdx >= visible.length - 1)
        return { state: ctx.state };
      return {
        state: produce(ctx.state, (draft) => {
          ops.swapItems(draft as S, payload.id, visible[visIdx + 1]!.id);
        }),
      };
    },
  );

  // ── duplicate ──
  const duplicate = zone.command(
    `${zoneName}:duplicate`,
    (ctx: { readonly state: S }, payload: { id: string }) => {
      const items = ops.getItems(ctx.state);
      const index = items.findIndex((item) => item.id === payload.id);
      if (index === -1) return { state: ctx.state };

      const original = items[index]!;
      const newId = uid();
      const cloned = config.onClone
        ? config.onClone(original, newId)
        : autoDeepClone(original, newId, uid);

      return {
        state: produce(ctx.state, (draft) => {
          ops.insertAfter(draft as S, index, cloned);
        }),
      };
    },
  );

  // ── copy ──
  const copy = zone.command(
    `${zoneName}:copy`,
    (ctx: { readonly state: S }, payload: { ids: string[] }) => {
      const items = ops.getItems(ctx.state);
      const found = payload.ids
        .map((id) => items.find((item) => item.id === id))
        .filter((t): t is T => Boolean(t));
      if (found.length === 0) return { state: ctx.state };

      const cloned = found.map((t) => ({ ...t }));

      // Write to module-level store (primary data channel)
      _clipboardStore = { source: clipboardSource, items: cloned, isCut: false };

      return {
        state: ctx.state,
        dispatch: OS_CLIPBOARD_SET({
          source: clipboardSource,
          items: cloned,
          isCut: false,
        }),
        clipboardWrite: {
          text: cloned.map(toText).join("\n"),
          json: JSON.stringify(cloned),
        },
      };
    },
  );

  // ── cut ──
  const cut = zone.command(
    `${zoneName}:cut`,
    (
      ctx: { readonly state: S },
      payload: { ids: string[]; focusId?: string },
    ) => {
      const items = ops.getItems(ctx.state);
      const found = payload.ids
        .map((id) => items.find((item) => item.id === id))
        .filter((t): t is T => Boolean(t));
      if (found.length === 0) return { state: ctx.state };

      // Focus Recovery Logic
      const focusId = payload.focusId;
      let focusCmd: BaseCommand | undefined;

      if (focusId && payload.ids.includes(focusId)) {
        const visible = config.filter
          ? items.filter(config.filter(ctx.state))
          : items;

        const currentIndex = visible.findIndex((item) => item.id === focusId);
        if (currentIndex !== -1) {
          const next = visible
            .slice(currentIndex + 1)
            .find((item) => !payload.ids.includes(item.id));
          const prev = visible
            .slice(0, currentIndex)
            .reverse()
            .find((item) => !payload.ids.includes(item.id));

          const targetId = next?.id ?? prev?.id;
          if (targetId) {
            focusCmd = FOCUS({
              zoneId: zoneName,
              itemId: targetId,
            });
          }
        }
      }

      const cloned = found.map((t) => ({ ...t }));

      // Write to module-level store (primary data channel)
      _clipboardStore = { source: clipboardSource, items: cloned, isCut: true };

      const commands: BaseCommand[] = [
        OS_CLIPBOARD_SET({
          source: clipboardSource,
          items: cloned,
          isCut: true,
        }),
      ];
      if (focusCmd) commands.push(focusCmd);

      return {
        state: produce(ctx.state, (draft) => {
          for (const id of payload.ids) {
            ops.removeItem(draft as S, id);
          }
        }),
        dispatch: commands,
        clipboardWrite: {
          text: cloned.map(toText).join("\n"),
          json: JSON.stringify(cloned),
        },
      };
    },
  );

  // ── paste ──
  const paste = zone.command(
    `${zoneName}:paste`,
    (ctx: { readonly state: S }, payload: { afterId?: string }) => {
      // Read from module-level clipboard store (kernel-agnostic)
      const clip = _clipboardStore;
      if (!clip || clip.items.length === 0) return { state: ctx.state };

      // Accept check: same source = auto-accept, different = use accept() if provided
      let clipItems: T[];
      if (clip.source === clipboardSource) {
        clipItems = clip.items as T[];
      } else if (config.accept) {
        clipItems = clip.items
          .map((item) => config.accept!(item))
          .filter((t): t is T => t !== null);
        if (clipItems.length === 0) return { state: ctx.state };
      } else {
        // Different source, no accept handler → reject
        return { state: ctx.state };
      }

      const pastedIds: string[] = [];
      const nextState = produce(ctx.state, (draft) => {
        const items = ops.getItems(ctx.state);
        let insertIdx = payload.afterId
          ? items.findIndex((item) => item.id === payload.afterId)
          : items.length - 1;
        if (insertIdx === -1) insertIdx = items.length - 1;

        for (let i = 0; i < clipItems.length; i++) {
          const source = clipItems[i]!;
          const newId = uid();
          let newItem = config.onClone
            ? config.onClone(source, newId)
            : autoDeepClone(source, newId, uid);
          if (config.onPaste) {
            newItem = config.onPaste(newItem, ctx.state);
          }
          pastedIds.push(newItem.id);
          ops.insertAfter(draft as S, insertIdx + i, newItem);
        }
      });

      const commands: BaseCommand[] = [];
      if (pastedIds.length > 0) {
        commands.push(
          FOCUS({
            zoneId: zoneName,
            itemId: pastedIds[pastedIds.length - 1]!,
            selection: pastedIds,
          }),
        );
      }

      return {
        state: nextState,
        dispatch: commands.length > 0 ? commands : undefined,
      };
    },
  );

  // ── collectionBindings ──
  function collectionBindings(): CollectionBindingsResult {
    return {
      onDelete: (cursor) => {
        const ids =
          cursor.selection.length > 0
            ? cursor.selection.map(toEntityId)
            : [toEntityId(cursor.focusId)];
        return ids.map((id) => remove({ id }));
      },
      onMoveUp: (cursor) => moveUp({ id: toEntityId(cursor.focusId) }),
      onMoveDown: (cursor) => moveDown({ id: toEntityId(cursor.focusId) }),
      onCopy: (cursor) => {
        const ids =
          cursor.selection.length > 0
            ? cursor.selection.map(toEntityId)
            : [toEntityId(cursor.focusId)];
        return copy({ ids });
      },
      onCut: (cursor) => {
        const ids =
          cursor.selection.length > 0
            ? cursor.selection.map(toEntityId)
            : [toEntityId(cursor.focusId)];
        return cut({ ids, focusId: toEntityId(cursor.focusId) });
      },
      onPaste: (cursor) => paste({ afterId: toEntityId(cursor.focusId) }),
      keybindings: [
        {
          key: "Meta+D",
          command: (cursor) => duplicate({ id: toEntityId(cursor.focusId) }),
        },
      ],
    };
  }

  return {
    ...zone,
    remove,
    moveUp,
    moveDown,
    duplicate,
    copy,
    cut,
    paste,
    collectionBindings,
  };
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
