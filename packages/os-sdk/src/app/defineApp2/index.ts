/**
 * defineApp2 — Projection v2.2 SDK factory.
 *
 * Two-track Big Bang: parallel to defineApp, shares kernel infrastructure.
 * Key difference: createZone(name, ZoneConfig) directly produces ZoneHandle<E,C>
 * with Zone FC — no separate bind() call.
 */

import { defineScope } from "@kernel";
import type { CommandFactory } from "@kernel/core/tokens";
import { registerAppSlice } from "@os-core/engine/appState";
import React from "react";
import type { FlatHandler, Selector } from "../defineApp/types";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

/** Role preset — OCP-compliant role definition */
interface RolePreset {
  readonly name: string;
}

/** Zone config for createZone */
// biome-ignore lint/suspicious/noExplicitAny: CommandFactory variance requires any
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- CommandFactory contravariance
interface ZoneConfig<S, E, C extends Record<string, (...args: any[]) => any>> {
  role: RolePreset;
  entity: E;
  commands: C;
  data: (state: S) => E[];
}

/** Render prop context provided by Zone FC */
interface ZoneRenderContext<E, C> {
  Items: React.FC<{
    children: (item: Readonly<E>, Item: FieldWrappers<E>) => React.ReactElement;
  }>;
  Trigger: React.FC<{
    onPress: (cmd: C) => unknown;
    children: React.ReactElement;
  }>;
}

/** Mapped type: entity keys (except id) → asChild FC */
type FieldWrappers<E> = {
  [K in Exclude<keyof E, "id">]: React.FC<{ children: React.ReactElement }>;
};

/** Zone handle returned by createZone */
interface ZoneHandle<E, C> {
  Zone: React.FC<{
    children: (zone: ZoneRenderContext<E, C>) => React.ReactElement;
  }>;
}

/** Zone binding entry for defineApp2 — stored in __zoneBindings */
interface ZoneBinding2Entry {
  role: string;
  // biome-ignore lint/suspicious/noExplicitAny: heterogeneous command factories
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous command factories
  commands: Record<string, (...args: any[]) => any>;
  data: (state: unknown) => unknown[];
}

/** AppHandle2 returned by defineApp2 */
interface AppHandle2<S> {
  command<T extends string, P = void>(
    type: T,
    handler: FlatHandler<S, P>,
  ): CommandFactory<T, P>;

  // biome-ignore lint/suspicious/noExplicitAny: CommandFactory variance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CommandFactory contravariance
  createZone<E, C extends Record<string, (...args: any[]) => any>>(
    name: string,
    config: ZoneConfig<S, E, C>,
  ): ZoneHandle<E, C>;

  useComputed<T>(fn: (state: S) => T): T;
  useComputed<T>(selector: Selector<S, T>): T;

  readonly __appId: string;
  readonly __zoneBindings: Map<string, ZoneBinding2Entry>;
}

// biome-ignore lint/suspicious/noExplicitAny: cloneElement type erasure at asChild boundary
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- asChild cloneElement requires any
type AnyElement = React.ReactElement<any>;

/** Merge props into a ReactElement via cloneElement (asChild pattern) */
function mergeProps(
  element: React.ReactElement,
  props: Record<string, unknown>,
): React.ReactElement {
  return React.cloneElement(element as AnyElement, props);
}

/** Container role → item role mapping */
const ITEM_ROLE_MAP: Record<string, string> = {
  listbox: "option",
  tree: "treeitem",
  grid: "row",
  treegrid: "row",
  menu: "menuitem",
  tablist: "tab",
};

// ═══════════════════════════════════════════════════════════════════
// defineApp2
// ═══════════════════════════════════════════════════════════════════

export function defineApp2<S>(appId: string, initialState: S): AppHandle2<S> {
  const slice = registerAppSlice<S>(appId, { initialState });

  const zoneBindings = new Map<string, ZoneBinding2Entry>();

  // ── command ──

  function command<T extends string, P = void>(
    type: T,
    handler: FlatHandler<S, P>,
  ): CommandFactory<T, P> {
    const kernelHandler = (ctx: { readonly state: S }) => (payload: P) =>
      handler(ctx, payload);

    const defineCmd = slice.group.defineCommand as (
      type: string,
      handler: unknown,
    ) => CommandFactory<string, unknown>;

    return defineCmd(type, kernelHandler) as unknown as CommandFactory<T, P>;
  }

  // ── createZone ──

  // biome-ignore lint/suspicious/noExplicitAny: CommandFactory variance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CommandFactory contravariance
  function createZone<E, C extends Record<string, (...args: any[]) => any>>(
    name: string,
    config: ZoneConfig<S, E, C>,
  ): ZoneHandle<E, C> {
    const scope = defineScope(`${appId}:${name}`);
    slice.group.group({ scope });

    // Register in __zoneBindings
    zoneBindings.set(name, {
      role: config.role.name,
      commands: config.commands,
      data: config.data as (state: unknown) => unknown[],
    });

    // ── Zone FC — Projection v2.2 asChild render prop ──

    let triggerCounter = 0;

    const Zone: React.FC<{
      children: (zone: ZoneRenderContext<E, C>) => React.ReactElement;
    }> = ({ children }) => {
      // Read entities from data accessor using initial state
      // (reactive state reading via useComputed is a future concern)
      const entities = config.data(initialState);

      // Items: iterate entities, call (item, Item) callback, inject ARIA
      const Items: React.FC<{
        children: (
          item: Readonly<E>,
          Item: FieldWrappers<E>,
        ) => React.ReactElement;
      }> = ({ children: itemCallback }) => {
        const itemElements = entities.map((entity) => {
          const entityObj = entity as Record<string, unknown> & { id: string };

          // Build field wrappers from entity keys (excluding "id")
          const fieldWrappers: Record<
            string,
            React.FC<{ children: React.ReactElement }>
          > = {};
          for (const key of Object.keys(entityObj)) {
            if (key === "id") continue;
            const fieldName = key;
            fieldWrappers[fieldName] = ({ children: child }) =>
              mergeProps(child, { "data-field": fieldName });
          }

          const element = itemCallback(
            entity,
            fieldWrappers as FieldWrappers<E>,
          );

          // Inject item ARIA attrs via mergeProps
          return mergeProps(element, {
            key: entityObj.id,
            id: entityObj.id,
            role: ITEM_ROLE_MAP[config.role.name] ?? "option",
            "data-item": "",
          });
        });

        return React.createElement(React.Fragment, null, ...itemElements);
      };

      // Trigger: inject data-trigger-id via cloneElement
      const Trigger: React.FC<{
        onPress: (cmd: C) => unknown;
        children: React.ReactElement;
      }> = ({ children: child }) => {
        const triggerId = `${name}-trigger-${++triggerCounter}`;
        return mergeProps(child, { "data-trigger-id": triggerId });
      };

      // Call render prop with zone context
      const zoneContext: ZoneRenderContext<E, C> = { Items, Trigger };
      const element = children(zoneContext);

      // Inject container ARIA via cloneElement (asChild — 0 wrapper elements)
      return mergeProps(element, {
        role: config.role.name,
      });
    };

    return { Zone };
  }

  // ── useComputed ──

  function useComputed<T>(selectorOrFn: Selector<S, T> | ((s: S) => T)): T {
    const fn =
      typeof selectorOrFn === "object" &&
      selectorOrFn !== null &&
      "select" in selectorOrFn
        ? (s: S) => (selectorOrFn as Selector<S, T>).select(s)
        : (selectorOrFn as (s: S) => T);
    return slice.useComputed(fn);
  }

  return {
    command,
    createZone,
    useComputed,
    __appId: appId,
    __zoneBindings: zoneBindings,
  };
}
