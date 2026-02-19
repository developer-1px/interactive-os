/**
 * createCollectionZone — Collection Zone Facade
 *
 * A factory that wraps createZone to auto-generate CRUD commands
 * (remove, moveUp, moveDown, duplicate) for ordered collections.
 *
 * The facade operates on a normalized internal form { ids, entities },
 * and apps provide normalize/denormalize adapters via presets:
 *   - fromArray:    for SectionEntry[] style (Builder)
 *   - fromEntities: for Record<id, T> + order[] style (Todo)
 *
 * @example
 *   const sidebar = createCollectionZone(BuilderApp, "sidebar", {
 *     schema: SectionSchema,
 *     ...fromArray((s) => s.data.sections),
 *   });
 *   sidebar.remove({ id: "hero" });
 *   sidebar.moveUp({ id: "news" });
 */

import { produce } from "immer";
import type { ZodSchema } from "zod";
import type { AppHandle, ZoneHandle } from "@/os/defineApp.types";
import type { CommandFactory } from "@kernel/core/tokens";

// ═══════════════════════════════════════════════════════════════════
// Normalized Form — single internal representation
// ═══════════════════════════════════════════════════════════════════

export interface Normalized<T = any> {
    ids: string[];
    entities: Record<string, T>;
}

// ═══════════════════════════════════════════════════════════════════
// Collection Adapter — normalize/denormalize pair
// ═══════════════════════════════════════════════════════════════════

export interface CollectionAdapter<S, T = any> {
    normalize: (state: S) => Normalized<T>;
    denormalize: (draft: S, data: Normalized<T>) => void;
}

// ═══════════════════════════════════════════════════════════════════
// Collection Config
// ═══════════════════════════════════════════════════════════════════

export interface CollectionConfig<S, T = any> extends CollectionAdapter<S, T> {
    schema: ZodSchema<T>;
    /** Custom ID generation. Default: random 8-char alphanumeric. */
    generateId?: () => string;
}

// ═══════════════════════════════════════════════════════════════════
// Collection Zone Handle — extends ZoneHandle with CRUD commands
// ═══════════════════════════════════════════════════════════════════

export interface CollectionZoneHandle<S> extends ZoneHandle<S> {
    remove: CommandFactory<string, { id: string }>;
    moveUp: CommandFactory<string, { id: string }>;
    moveDown: CommandFactory<string, { id: string }>;
    duplicate: CommandFactory<string, { id: string }>;
}

// ═══════════════════════════════════════════════════════════════════
// Default ID generator
// ═══════════════════════════════════════════════════════════════════

const defaultGenerateId = () => Math.random().toString(36).slice(2, 10);

// ═══════════════════════════════════════════════════════════════════
// createCollectionZone — the facade
// ═══════════════════════════════════════════════════════════════════

export function createCollectionZone<S>(
    app: AppHandle<S>,
    zoneName: string,
    config: CollectionConfig<S>,
): CollectionZoneHandle<S> {
    const zone = app.createZone(zoneName);
    const uid = config.generateId ?? defaultGenerateId;

    // ── remove ──
    const remove = zone.command(
        `${zoneName}:remove`,
        (ctx: { readonly state: S }, payload: { id: string }) => {
            const normalized = config.normalize(ctx.state);
            const index = normalized.ids.indexOf(payload.id);
            if (index === -1) return { state: ctx.state };

            return {
                state: produce(ctx.state, (draft) => {
                    const n = config.normalize(draft as S);
                    n.ids.splice(index, 1);
                    delete n.entities[payload.id];
                    config.denormalize(draft as S, n);
                }),
            };
        },
    );

    // ── moveUp ──
    const moveUp = zone.command(
        `${zoneName}:moveUp`,
        (ctx: { readonly state: S }, payload: { id: string }) => {
            const normalized = config.normalize(ctx.state);
            const index = normalized.ids.indexOf(payload.id);
            if (index <= 0) return { state: ctx.state };

            return {
                state: produce(ctx.state, (draft) => {
                    const n = config.normalize(draft as S);
                    [n.ids[index - 1], n.ids[index]] = [n.ids[index]!, n.ids[index - 1]!];
                    config.denormalize(draft as S, n);
                }),
            };
        },
    );

    // ── moveDown ──
    const moveDown = zone.command(
        `${zoneName}:moveDown`,
        (ctx: { readonly state: S }, payload: { id: string }) => {
            const normalized = config.normalize(ctx.state);
            const index = normalized.ids.indexOf(payload.id);
            if (index === -1 || index >= normalized.ids.length - 1) {
                return { state: ctx.state };
            }

            return {
                state: produce(ctx.state, (draft) => {
                    const n = config.normalize(draft as S);
                    [n.ids[index], n.ids[index + 1]] = [n.ids[index + 1]!, n.ids[index]!];
                    config.denormalize(draft as S, n);
                }),
            };
        },
    );

    // ── duplicate ──
    const duplicate = zone.command(
        `${zoneName}:duplicate`,
        (ctx: { readonly state: S }, payload: { id: string }) => {
            const normalized = config.normalize(ctx.state);
            const index = normalized.ids.indexOf(payload.id);
            if (index === -1) return { state: ctx.state };

            const original = normalized.entities[payload.id];
            if (!original) return { state: ctx.state };

            const newId = uid();
            const cloned = { ...original, id: newId };

            return {
                state: produce(ctx.state, (draft) => {
                    const n = config.normalize(draft as S);
                    n.ids.splice(index + 1, 0, newId);
                    n.entities[newId] = cloned;
                    config.denormalize(draft as S, n);
                }),
            };
        },
    );

    return {
        ...zone,
        remove,
        moveUp,
        moveDown,
        duplicate,
    };
}

// ═══════════════════════════════════════════════════════════════════
// Presets: fromArray / fromEntities
// ═══════════════════════════════════════════════════════════════════

/**
 * fromArray — Adapter for array-based collections.
 *
 * The accessor must point to a direct property in the state
 * (e.g., `(s) => s.data.sections`). Works for both read (state)
 * and write (immer draft).
 *
 * Items must have an `id: string` field.
 */
export function fromArray<S, T extends { id: string }>(
    accessor: (state: S) => T[],
): CollectionAdapter<S, T> {
    return {
        normalize: (state: S): Normalized<T> => {
            const items = accessor(state);
            return {
                ids: items.map((item) => item.id),
                entities: Object.fromEntries(items.map((item) => [item.id, item])),
            };
        },
        denormalize: (draft: S, { ids, entities }: Normalized<T>): void => {
            const arr = accessor(draft);
            arr.length = 0;
            for (const id of ids) {
                const entity = entities[id];
                if (entity) arr.push(entity);
            }
        },
    };
}

/**
 * fromEntities — Adapter for entity-map + order-array collections.
 *
 * Already normalized by nature. The accessors point to the entities
 * record and the order array respectively.
 */
export function fromEntities<S, T extends { id: string }>(
    entitiesAccessor: (state: S) => Record<string, T>,
    orderAccessor: (state: S) => string[],
): CollectionAdapter<S, T> {
    return {
        normalize: (state: S): Normalized<T> => ({
            ids: [...orderAccessor(state)],
            entities: { ...entitiesAccessor(state) },
        }),
        denormalize: (draft: S, { ids, entities }: Normalized<T>): void => {
            // Replace order array contents
            const orderArr = orderAccessor(draft);
            orderArr.length = 0;
            orderArr.push(...ids);

            // Replace entities
            const entitiesObj = entitiesAccessor(draft);
            for (const key of Object.keys(entitiesObj)) {
                delete entitiesObj[key];
            }
            Object.assign(entitiesObj, entities);
        },
    };
}
