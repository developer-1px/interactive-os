/**
 * Projection Next API v2 — Interface
 *
 * Source: docs/0-inbox/38-[explain]projection-next-api-v2.md (What section)
 * Purpose: TypeScript 타입 레벨에서 API 계약을 확정한다.
 *
 * Key verification points:
 *   1. Entity interface → item.fieldName(data) + item.Field.fieldName(asChild) mapped type
 *   2. zone.Items render prop → item 타입이 entity에서 정확히 추론
 *   3. zone.Trigger cmd → 등록된 commands만 노출
 *   4. item.Children → 같은 item 타입으로 재귀
 *   5. asChild pattern → ReactElement children
 */

import type { FC, ReactElement, ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════
// Constraints
// ═══════════════════════════════════════════════════════════════

/** All entities must have an id */
export type EntityBase = { readonly id: string };

/** Command callable — created by AppHandle.command() */
export type CommandCallable = (payload: string) => unknown;

// ═══════════════════════════════════════════════════════════════
// AsChild
// ═══════════════════════════════════════════════════════════════

/** AsChild component props — single ReactElement child, attrs merged via cloneElement */
export interface AsChildProps {
  children: ReactElement;
}

// ═══════════════════════════════════════════════════════════════
// Item
// ═══════════════════════════════════════════════════════════════

/**
 * Field wrappers — asChild component per entity key (excluding id).
 * Usage: <item.Field.text><span>{item.text}</span></item.Field.text>
 */
export type FieldWrappers<E extends EntityBase> = {
  readonly [K in Exclude<keyof E, "id">]: FC<AsChildProps>;
};

/**
 * Item context — entity data values + Field asChild wrappers + Children.
 *
 * - item.text         → string (data, from Readonly<E>)
 * - item.Field.text   → FC<AsChildProps> (asChild, edit marking)
 * - item.Children     → FC (render prop, tree recursion)
 */
export type ItemContext<E extends EntityBase> = Readonly<E> & {
  readonly Field: FieldWrappers<E>;
  readonly Children: FC<{
    children: (item: ItemContext<E>) => ReactNode;
  }>;
};

// ═══════════════════════════════════════════════════════════════
// Zone
// ═══════════════════════════════════════════════════════════════

/**
 * Trigger props — onPress receives cmd object typed to registered commands only.
 * Usage: <zone.Trigger onPress={cmd => cmd.deleteTodo(item.id)}><button>×</button></zone.Trigger>
 */
export interface TriggerProps<C extends Record<string, CommandCallable>> {
  onPress: (cmd: Readonly<C>) => unknown;
  children: ReactElement;
}

/**
 * Zone context — provided via Zone render prop.
 * Usage: <TodoList.Zone>{(zone) => <zone.Items>...</zone.Items>}</TodoList.Zone>
 */
export interface ZoneContext<
  E extends EntityBase,
  C extends Record<string, CommandCallable>,
> {
  readonly Items: FC<{
    children: (item: ItemContext<E>) => ReactNode;
  }>;
  readonly Trigger: FC<TriggerProps<C>>;
}

/**
 * Zone handle — result of createZone.
 * Usage: <TodoList.Zone>{(zone) => ...}</TodoList.Zone>
 */
export interface ZoneHandle<
  E extends EntityBase,
  C extends Record<string, CommandCallable>,
> {
  readonly Zone: FC<{
    children: (zone: ZoneContext<E, C>) => ReactNode;
  }>;
}

// ═══════════════════════════════════════════════════════════════
// Zone Config
// ═══════════════════════════════════════════════════════════════

/** Zone config — passed to AppHandle.createZone() */
export interface ZoneConfig<
  E extends EntityBase,
  C extends Record<string, CommandCallable>,
> {
  role: string;
  entity?: E; // phantom type marker — type inference only, not read at runtime
  commands: C;
}

// ═══════════════════════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════════════════════

/**
 * App handle — entry point.
 * Usage:
 *   const TodoApp = defineApp("todo", initialState);
 *   const deleteTodo = TodoApp.command("deleteTodo", handler);
 *   const TodoList = TodoApp.createZone("list", config);
 */
export interface AppHandle<S> {
  createZone<E extends EntityBase, C extends Record<string, CommandCallable>>(
    name: string,
    config: ZoneConfig<E, C>,
  ): ZoneHandle<E, C>;

  command(
    name: string,
    handler: (state: S, payload: string) => S | undefined,
  ): CommandCallable;
}
