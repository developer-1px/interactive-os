/**
 * createCollectionZone — Collection Zone Facade
 *
 * Wraps createZone to auto-generate CRUD commands
 * (remove, moveUp, moveDown, duplicate) for ordered collections.
 *
 * Supports two data shapes via config:
 *   - accessor:     for T[] arrays (Builder)
 *   - fromEntities: for Record<id, T> + order[] (Todo)
 *
 * @example
 *   // Array-based (Builder)
 *   const sidebar = createCollectionZone(BuilderApp, "sidebar", {
 *     accessor: (s) => s.data.sections,
 *   });
 *
 *   // Entity+Order (Todo)
 *   const list = createCollectionZone(TodoApp, "list", {
 *     ...fromEntities((s) => s.data.todos, (s) => s.data.todoOrder),
 *   });
 */

import { produce } from "immer";
import type { AppHandle, ZoneHandle } from "@/os/defineApp.types";
import type { CommandFactory } from "@kernel/core/tokens";

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

/** Array-based config: single accessor to T[] */
export interface ArrayCollectionConfig<S, T extends { id: string }> {
    accessor: (state: S) => T[];
    extractId?: (focusId: string) => string;
    generateId?: () => string;
    onClone?: (original: T, newId: string) => T;
    /** Optional visibility filter for moveUp/moveDown. Items not matching are skipped. */
    filter?: (state: S) => (item: T) => boolean;
    /** Clipboard config for copy/cut/paste. */
    clipboard?: ClipboardConfig<S, T>;
}

/** Entity+Order config: produced by fromEntities() */
export interface EntityCollectionConfig<S, T extends { id: string }> {
    _ops: ItemOps<S, T>;
    extractId?: (focusId: string) => string;
    generateId?: () => string;
    onClone?: (original: T, newId: string) => T;
    /** Optional visibility filter for moveUp/moveDown. */
    filter?: (state: S) => (item: T) => boolean;
    /** Clipboard config for copy/cut/paste. */
    clipboard?: ClipboardConfig<S, T>;
}

export interface ClipboardConfig<S, T extends { id: string }> {
    /** Accessor to the clipboard state slot. Must return { items: T[], isCut: boolean } | null. */
    accessor: (state: S) => { items: T[]; isCut: boolean } | null;
    /** Serialize items for OS clipboard text. */
    toText: (items: T[]) => string;
    /** Transform item on paste. E.g., assign current category. */
    onPaste?: (item: T, state: S) => T;
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
    cut: CommandFactory<string, { ids: string[] }>;
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
    keybindings: Array<{ key: string; command: (cursor: { focusId: string; selection: string[] }) => any }>;
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
            const idx = arr.findIndex(item => item.id === id);
            if (idx !== -1) arr.splice(idx, 1);
        },
        swapItems: (draft, idA, idB) => {
            const arr = accessor(draft);
            const iA = arr.findIndex(item => item.id === idA);
            const iB = arr.findIndex(item => item.id === idB);
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
// Default ID generator
// ═══════════════════════════════════════════════════════════════════

const defaultGenerateId = () => Math.random().toString(36).slice(2, 10);

/**
 * Set clipboard state through accessor.
 * Since Immer draft accessors return the draft value, we need to find
 * the parent and set the property. We use a trick: call the accessor on
 * the draft and Object.assign the result.
 */
function setClipboard<S, T extends { id: string }>(
    draft: S,
    accessor: (state: S) => { items: T[]; isCut: boolean } | null,
    value: { items: T[]; isCut: boolean },
): void {
    // Walk up to find the parent object that contains the clipboard field.
    // Since we can't generically set a nullable accessor's return, we need
    // the accessor to point to a mutable slot. We'll use a workaround:
    // wrap the accessor result in a parent search.
    // Simple approach: scan the draft for the key whose value matches accessor result.
    // This is fragile, so instead we require clipboard accessor to always
    // return a non-null reference or use a setter pattern.

    // Pragmatic solution: use a getter/setter pair by convention.
    // For now, we'll use a known pattern: the accessor returns `state.ui.clipboard`,
    // and we directly set it on the draft.
    // This means the ClipboardConfig needs a setter too.
    // But to keep API simple, let's just do: accessor returns parent.clipboard,
    // and we detect the property name.
    // Actually, simplest: just make setClipboard a config method.
    // KISS: add `setAccessor` to ClipboardConfig.
    // NO — too complex. Let's just store clipboard items in a known location
    // that the accessor can find.

    // Pragmatic: We'll iterate draft keys to find a match.
    // Actually, the simplest approach that works with Immer:
    // accessor(draft) returns a draft proxy. We can mutate it in place
    // if it's not null. If it IS null, we can't because there's no reference.
    // Solution: require the clipboard slot to be initialized to a non-null value... NO.

    // Final approach: require a `set` function in ClipboardConfig.
    // This is the cleanest.
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
    const ops: ItemOps<S, T> = isEntityConfig(config)
        ? config._ops
        : opsFromAccessor((config as ArrayCollectionConfig<S, T>).accessor);

    // ── remove ──
    const remove = zone.command(
        `${zoneName}:remove`,
        (ctx: { readonly state: S }, payload: { id: string }) => {
            const items = ops.getItems(ctx.state);
            if (!items.some(item => item.id === payload.id)) return { state: ctx.state };
            return {
                state: produce(ctx.state, (draft) => {
                    ops.removeItem(draft as S, payload.id);
                }),
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
            const visIdx = visible.findIndex(item => item.id === payload.id);
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
            const visIdx = visible.findIndex(item => item.id === payload.id);
            if (visIdx === -1 || visIdx >= visible.length - 1) return { state: ctx.state };
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
            const index = items.findIndex(item => item.id === payload.id);
            if (index === -1) return { state: ctx.state };

            const original = items[index]!;
            const newId = uid();
            const cloned = config.onClone
                ? config.onClone(original, newId)
                : { ...original, id: newId } as T;

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
                .map(id => items.find(item => item.id === id))
                .filter((t): t is T => Boolean(t));
            if (found.length === 0) return { state: ctx.state };

            const clipCfg = config.clipboard;
            return {
                state: clipCfg
                    ? produce(ctx.state, (draft) => {
                        const clipData = { items: found.map(t => ({ ...t })), isCut: false as const };
                        clipCfg.set(draft as S, clipData);
                    })
                    : ctx.state,
                clipboardWrite: clipCfg ? {
                    text: clipCfg.toText(found),
                    json: JSON.stringify(found),
                } : undefined,
            };
        },
    );

    // ── cut ──
    const cut = zone.command(
        `${zoneName}:cut`,
        (ctx: { readonly state: S }, payload: { ids: string[] }) => {
            const items = ops.getItems(ctx.state);
            const found = payload.ids
                .map(id => items.find(item => item.id === id))
                .filter((t): t is T => Boolean(t));
            if (found.length === 0) return { state: ctx.state };

            const clipCfg = config.clipboard;
            return {
                state: produce(ctx.state, (draft) => {
                    if (clipCfg) {
                        clipCfg.set(draft as S, { items: found.map(t => ({ ...t })), isCut: true });
                    }
                    for (const id of payload.ids) {
                        ops.removeItem(draft as S, id);
                    }
                }),
                clipboardWrite: clipCfg ? {
                    text: clipCfg.toText(found),
                    json: JSON.stringify(found),
                } : undefined,
            };
        },
    );

    // ── paste ──
    const paste = zone.command(
        `${zoneName}:paste`,
        (ctx: { readonly state: S }, payload: { afterId?: string }) => {
            const clipCfg = config.clipboard;
            if (!clipCfg) return { state: ctx.state };
            const clip = clipCfg.accessor(ctx.state);
            if (!clip || clip.items.length === 0) return { state: ctx.state };

            return {
                state: produce(ctx.state, (draft) => {
                    const items = ops.getItems(ctx.state);
                    let insertIdx = payload.afterId
                        ? items.findIndex(item => item.id === payload.afterId)
                        : items.length - 1;
                    if (insertIdx === -1) insertIdx = items.length - 1;

                    for (let i = 0; i < clip.items.length; i++) {
                        const source = clip.items[i]!;
                        const newId = uid();
                        let newItem = { ...source, id: newId } as T;
                        if (clipCfg.onPaste) {
                            newItem = clipCfg.onPaste(newItem, ctx.state);
                        }
                        ops.insertAfter(draft as S, insertIdx + i, newItem);
                    }
                }),
            };
        },
    );

    // ── collectionBindings ──
    function collectionBindings(): CollectionBindingsResult {
        return {
            onDelete: (cursor) => {
                const ids = cursor.selection.length > 0
                    ? cursor.selection.map(toEntityId)
                    : [toEntityId(cursor.focusId)];
                return ids.map(id => remove({ id }));
            },
            onMoveUp: (cursor) => moveUp({ id: toEntityId(cursor.focusId) }),
            onMoveDown: (cursor) => moveDown({ id: toEntityId(cursor.focusId) }),
            onCopy: (cursor) => {
                const ids = cursor.selection.length > 0
                    ? cursor.selection.map(toEntityId)
                    : [toEntityId(cursor.focusId)];
                return copy({ ids });
            },
            onCut: (cursor) => {
                const ids = cursor.selection.length > 0
                    ? cursor.selection.map(toEntityId)
                    : [toEntityId(cursor.focusId)];
                return cut({ ids });
            },
            onPaste: (cursor) => paste({ afterId: toEntityId(cursor.focusId) }),
            keybindings: [
                { key: "Meta+D", command: (cursor) => duplicate({ id: toEntityId(cursor.focusId) }) },
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
                return orderAccessor(state).map(id => entities[id]!).filter(Boolean);
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
