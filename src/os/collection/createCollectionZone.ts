/**
 * createCollectionZone — Tree-aware CRUD + clipboard commands.
 *
 * Wraps createZone to auto-generate: remove, moveUp, moveDown,
 * move, duplicate, copy, cut, paste.
 */

import type { BaseCommand } from "@kernel/core/tokens";
import { produce } from "immer";
import { OS_FOCUS } from "@/os/3-commands/focus/focus";
import { OS_CLIPBOARD_SET } from "@/os/3-commands/clipboard/clipboardSet";
import { findInTree, findParentOf, insertChild, removeFromTree } from "@/os/collection/treeUtils";
import type { AppHandle } from "@/os/defineApp.types";
import {
  type CollectionConfig,
  type CollectionZoneHandle,
  type CollectionBindingsResult,
  type ArrayCollectionConfig,
  type ItemOps,
  isEntityConfig,
  opsFromAccessor,
  defaultGenerateId,
  defaultToText,
  autoDeepClone,
} from "@/os/collection/collectionZone.core";

// Re-export types for consumers
export type { CollectionConfig, CollectionZoneHandle, CollectionBindingsResult, ArrayCollectionConfig, EntityCollectionConfig } from "@/os/collection/collectionZone.core";
export { fromEntities } from "@/os/collection/collectionZone.core";

// ═══════════════════════════════════════════════════════════════════
// Internal clipboard store
// ═══════════════════════════════════════════════════════════════════

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

/** @internal Set text to clipboard store (used by static item copy) */
export function _setTextClipboardStore(text: string): void {
  _clipboardStore = {
    source: "text",
    items: [{ type: "text", value: text }],
    isCut: false,
  };
}

/** @internal Read clipboard first item for paste bubbling accept check */
export function _getClipboardPreview(): unknown | null {
  return _clipboardStore.items[0] ?? null;
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
  const toEntityId = config.extractId ?? ((id: string) => id);
  /** Reverse of extractId: entity ID → DOM item ID for FOCUS dispatch */
  const toItemId = (entityId: string) => entityId;
  const toText = config.text ?? defaultToText;
  const clipboardSource = zoneName; // Unique per collection
  const ops: ItemOps<S, T> = isEntityConfig(config)
    ? config._ops
    : opsFromAccessor((config as ArrayCollectionConfig<S, T>).accessor);

  // ── remove ── (tree-aware)
  const remove = zone.command(
    `${zoneName}:remove`,
    (ctx: { readonly state: S }, payload: { id: string }) => {
      const allItems = ops.getItems(ctx.state);
      const isRoot = allItems.some((item) => item.id === payload.id);
      const isNested = !isRoot && !!findInTree(allItems as any[], payload.id);
      if (!isRoot && !isNested) return { state: ctx.state };

      let focusCmd: BaseCommand | undefined;
      if (isRoot) {
        // Focus recovery for root items
        const visible = config.filter
          ? allItems.filter(config.filter(ctx.state))
          : allItems;
        const visIdx = visible.findIndex((item) => item.id === payload.id);
        if (visIdx !== -1) {
          const neighbor = visible[visIdx + 1] ?? visible[visIdx - 1];
          if (neighbor) {
            focusCmd = OS_FOCUS({
              zoneId: zoneName,
              itemId: toItemId(neighbor.id),
            });
          }
        }
      } else {
        // Focus recovery for nested items: next sibling → prev sibling → parent
        const parent = findParentOf(allItems as any[], payload.id);
        if (parent?.children) {
          const idx = parent.children.findIndex((c: { id: string }) => c.id === payload.id);
          const neighbor = parent.children[idx + 1] ?? parent.children[idx - 1];
          const targetId = neighbor?.id ?? parent.id;
          focusCmd = OS_FOCUS({
            zoneId: zoneName,
            itemId: toItemId(targetId),
          });
        }
      }

      return {
        state: produce(ctx.state, (draft) => {
          if (isRoot) {
            ops.removeItem(draft as S, payload.id);
          } else {
            removeFromTree(ops.getItems(draft as S) as any[], payload.id);
          }
        }),
        dispatch: focusCmd,
      };
    },
  );

  // ── moveUp / moveDown ── (tree-aware, shared logic)
  function makeMoveCommand(name: string, dir: -1 | 1) {
    return zone.command(
      `${zoneName}:${name}`,
      (ctx: { readonly state: S }, payload: { id: string }) => {
        const allItems = ops.getItems(ctx.state);
        const rootIdx = allItems.findIndex((item) => item.id === payload.id);

        if (rootIdx !== -1) {
          const visible = config.filter
            ? allItems.filter(config.filter(ctx.state))
            : allItems;
          const visIdx = visible.findIndex((item) => item.id === payload.id);
          const neighborIdx = visIdx + dir;
          if (neighborIdx < 0 || neighborIdx >= visible.length) return { state: ctx.state };
          return {
            state: produce(ctx.state, (draft) => {
              ops.swapItems(draft as S, payload.id, visible[neighborIdx]!.id);
            }),
          };
        }

        const parent = findParentOf(allItems as any[], payload.id);
        if (!parent?.children) return { state: ctx.state };
        const idx = parent.children.findIndex((c: { id: string }) => c.id === payload.id);
        const neighborIdx = idx + dir;
        if (neighborIdx < 0 || neighborIdx >= parent.children.length) return { state: ctx.state };

        return {
          state: produce(ctx.state, (draft) => {
            const draftParent = findInTree(ops.getItems(draft as S) as any[], parent.id);
            if (draftParent?.children) {
              const arr = draftParent.children;
              [arr[idx], arr[neighborIdx]] = [arr[neighborIdx]!, arr[idx]!];
            }
          }),
        };
      },
    );
  }

  const moveUp = makeMoveCommand("moveUp", -1);
  const moveDown = makeMoveCommand("moveDown", 1);

  // ── duplicate ── (tree-aware)
  const duplicate = zone.command(
    `${zoneName}:duplicate`,
    (ctx: { readonly state: S }, payload: { id: string }) => {
      const items = ops.getItems(ctx.state);
      const rootIdx = items.findIndex((item) => item.id === payload.id);

      if (rootIdx !== -1) {
        // Root-level duplicate
        const original = items[rootIdx]!;
        const newId = uid();
        const cloned = config.onClone
          ? config.onClone(original, newId)
          : autoDeepClone(original, newId, uid);
        return {
          state: produce(ctx.state, (draft) => {
            ops.insertAfter(draft as S, rootIdx, cloned);
          }),
        };
      }

      // Nested duplicate: clone within parent's children
      const original = findInTree(items as any[], payload.id) as T | undefined;
      if (!original) return { state: ctx.state };

      const newId = uid();
      const cloned = config.onClone
        ? config.onClone(original, newId)
        : autoDeepClone(original, newId, uid);

      return {
        state: produce(ctx.state, (draft) => {
          const draftItems = ops.getItems(draft as S) as any[];
          const parent = findParentOf(draftItems, payload.id);
          if (parent) {
            insertChild(draftItems, parent.id, cloned as any, payload.id);
          }
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
        .map((id) => items.find((item) => item.id === id)
          ?? findInTree(items as any[], id) as T | undefined)
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

  // ── cut ── (tree-aware)
  const cut = zone.command(
    `${zoneName}:cut`,
    (
      ctx: { readonly state: S },
      payload: { ids: string[]; focusId?: string },
    ) => {
      const items = ops.getItems(ctx.state);
      const found = payload.ids
        .map((id) => items.find((item) => item.id === id)
          ?? findInTree(items as any[], id) as T | undefined)
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
            focusCmd = OS_FOCUS({
              zoneId: zoneName,
              itemId: toItemId(targetId),
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
          const draftItems = ops.getItems(draft as S);
          for (const id of payload.ids) {
            const isRoot = draftItems.some((item) => item.id === id);
            if (isRoot) {
              ops.removeItem(draft as S, id);
            } else {
              removeFromTree(draftItems as any[], id);
            }
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
        const readItems = ops.getItems(ctx.state);
        const draftItems = ops.getItems(draft as S);

        // Tree-aware paste: check if target node has `accept` for clipboard item type
        const targetId = payload.afterId;
        const targetNode = targetId
          ? findInTree(readItems as any[], targetId)
          : undefined;
        const targetAccept = (targetNode as any)?.accept as string[] | undefined;

        // Track the last inserted id for sequential pastes within the same parent
        let lastInsertedId: string | undefined;

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

          const itemType = (source as any).type as string | undefined;
          const afterSibling = lastInsertedId ?? targetId;

          if (targetId && targetAccept && itemType && targetAccept.includes(itemType)) {
            // Case 1: Target accepts this type → insert as child of target
            insertChild(draftItems as any[], targetId, newItem as any, lastInsertedId);
          } else if (targetId && readItems.findIndex((item) => item.id === targetId) === -1) {
            // Case 2: Target is a nested node (not in root) → insert as sibling within parent
            const parentNode = findParentOf(draftItems as any[], targetId);
            if (parentNode) {
              insertChild(draftItems as any[], parentNode.id, newItem as any, afterSibling);
            } else {
              // Fallback: append to root
              ops.insertAfter(draft as S, readItems.length - 1 + i, newItem);
            }
          } else {
            // Case 3: Flat insert at root level (existing behavior)
            let insertIdx = targetId
              ? readItems.findIndex((item) => item.id === targetId)
              : readItems.length - 1;
            if (insertIdx === -1) insertIdx = readItems.length - 1;
            ops.insertAfter(draft as S, insertIdx + i, newItem);
          }

          lastInsertedId = newItem.id;
        }
      });

      const commands: BaseCommand[] = [];
      if (pastedIds.length > 0) {
        commands.push(
          OS_FOCUS({
            zoneId: zoneName,
            itemId: toItemId(pastedIds[pastedIds.length - 1]!),
            selection: pastedIds.map(toItemId),
          }),
        );
      }

      return {
        state: nextState,
        dispatch: commands.length > 0 ? commands : undefined,
      };
    },
  );

  // ── move ── (atomic, no clipboard, single undo step)
  const move = zone.command(
    `${zoneName}:move`,
    (ctx: { readonly state: S }, payload: { id: string; toParentId?: string; afterId?: string }) => {
      const items = ops.getItems(ctx.state);
      const node = findInTree(items as any[], payload.id) as T | undefined;
      if (!node) return { state: ctx.state };

      // Validate accept constraint if moving into a parent
      if (payload.toParentId) {
        const targetParent = findInTree(items as any[], payload.toParentId) as any;
        if (targetParent?.accept && !(node as any).type) return { state: ctx.state };
        if (targetParent?.accept && !targetParent.accept.includes((node as any).type)) {
          return { state: ctx.state };
        }
      }

      return {
        state: produce(ctx.state, (draft) => {
          const draftItems = ops.getItems(draft as S) as any[];
          // 1. Remove from current position
          removeFromTree(draftItems, payload.id);
          // 2. Insert at new position
          if (payload.toParentId) {
            insertChild(draftItems, payload.toParentId, node as any, payload.afterId);
          } else if (payload.afterId) {
            // Insert as root sibling after afterId
            const idx = draftItems.findIndex((i: any) => i.id === payload.afterId);
            if (idx !== -1) {
              draftItems.splice(idx + 1, 0, node);
            } else {
              draftItems.push(node);
            }
          } else {
            draftItems.push(node);
          }
        }),
        dispatch: OS_FOCUS({
          zoneId: zoneName,
          itemId: toItemId(payload.id),
        }),
      };
    },
  );

  // ── collectionBindings ──
  function collectionBindings(): CollectionBindingsResult {
    const idsFromCursor = (cursor: { focusId: string; selection: string[] }) =>
      cursor.selection.length > 0
        ? cursor.selection.map(toEntityId)
        : [toEntityId(cursor.focusId)];

    return {
      onDelete: (cursor) => idsFromCursor(cursor).map((id) => remove({ id })),
      onMoveUp: (cursor) => moveUp({ id: toEntityId(cursor.focusId) }),
      onMoveDown: (cursor) => moveDown({ id: toEntityId(cursor.focusId) }),
      onCopy: (cursor) => copy({ ids: idsFromCursor(cursor) }),
      onCut: (cursor) => cut({ ids: idsFromCursor(cursor), focusId: toEntityId(cursor.focusId) }),
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
    /** Canonical zone ID — use this for <Zone id={}> in DOM. Single source of truth. */
    zoneId: zoneName,
    remove,
    moveUp,
    moveDown,
    move,
    duplicate,
    copy,
    cut,
    paste,
    collectionBindings,
  };
}
