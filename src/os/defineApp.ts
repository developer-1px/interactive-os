/**
 * defineApp v5 — Production Implementation
 *
 * Entity Tree:
 *   App (= parent Scope)
 *     ├── State
 *     ├── Selector[]       (state → T, branded, named)
 *     ├── Condition[]      (state → boolean, branded, named)
 *     ├── Command[]        (type + handler + when?)
 *     └── Zone[]           (= child Scope, recursive)
 *           ├── role, Commands, Keybinding[], Bindings
 *           └── UI (Zone, Item, Field, When components)
 *
 * Key decisions (W1-W33):
 *   - App owns Commands. Zone = interaction boundary.
 *   - when = dispatch guard (kernel processCommand checks).
 *   - Condition = branded boolean predicate, separate from Selector.
 *   - Flat handlers: (ctx, payload) => result
 *
 * @example
 *   const TodoApp = defineApp<TodoState>("todo", INITIAL);
 *   const canUndo = TodoApp.condition("canUndo", s => s.history.past.length > 0);
 *   const listZone = TodoApp.createZone("list");
 *   const toggleTodo = listZone.command("TOGGLE", handler);
 *   const { Zone, Item } = listZone.bind({ role: "listbox", onCheck: toggleTodo });
 */

import { createKernel, defineScope } from "@kernel";
import type {
  BaseCommand,
  CommandFactory,
  ScopeToken,
} from "@kernel/core/tokens";
import { OS } from "@os/AntigravityOS";
import { Keybindings as KeybindingsRegistry } from "@os/keymaps/keybindings";
import React, { type ReactNode } from "react";
import { registerAppSlice } from "./appSlice";
import {
  beginTransaction,
  createHistoryMiddleware,
  endTransaction,
} from "./middleware/historyKernelMiddleware";

// Re-export all types for consumers
export type {
  AppHandle,
  BoundComponents,
  Condition,
  CommandContext,
  FieldBindings,
  FlatHandler,
  HandlerResult,
  KeybindingEntry,
  Selector,
  TestInstance,
  ZoneBindings,
  ZoneHandle,
} from "./defineApp.types";

import {
  __conditionBrand,
  __selectorBrand,
  type AppHandle,
  type BoundComponents,
  type Condition,
  type FieldBindings,
  type FlatHandler,
  type KeybindingEntry,
  type Selector,
  type ZoneBindings,
  type ZoneHandle,
} from "./defineApp.types";
import {
  createCompoundTrigger,
  createSimpleTrigger,
} from "./defineApp.trigger";
import { createTestInstance } from "./defineApp.testInstance";
import { createBoundComponents } from "./defineApp.bind";
import { createWidgetFactory } from "./defineApp.widget";

// ═══════════════════════════════════════════════════════════════════
// defineApp — Production Implementation
// ═══════════════════════════════════════════════════════════════════

export function defineApp<S>(
  appId: string,
  initialState: S,
  options?: {
    history?: boolean;
    persistence?: { key: string; debounceMs?: number };
    /** v3 compat: named selectors for test instance select proxy */
    selectors?: Record<string, (state: S, ...args: any[]) => any>;
  },
): AppHandle<S> & { [key: string]: any } {
  // ── Production: register on singleton kernel ──
  const enableHistory = options?.history ?? false;
  const slice = registerAppSlice<S>(appId, {
    initialState,
    history: enableHistory || undefined,
    persistence: options?.persistence ?? undefined,
  } as any);

  // ── Registries ──
  const conditionRegistry: Condition<S>[] = [];
  const conditionNames = new Set<string>();
  const selectorRegistry: Selector<S, unknown>[] = [];
  const selectorNames = new Set<string>();

  // For test instance: track all flat handlers + when guards
  const flatHandlerRegistry = new Map<
    string,
    { handler: FlatHandler<S, any>; when?: Condition<S> }
  >();
  // For v3 test compat: track CommandFactory instances
  const allCommandFactories = new Map<string, CommandFactory<any, any>>();

  // ── condition ──

  function defineCondition(
    name: string,
    predicate: (state: S) => boolean,
  ): Condition<S> {
    if (conditionNames.has(name)) {
      throw new Error(
        `[defineApp:${appId}] Condition "${name}" already defined`,
      );
    }
    conditionNames.add(name);
    const cond = {
      name,
      evaluate: predicate,
      [__conditionBrand]: true as const,
    } as unknown as Condition<S>;
    conditionRegistry.push(cond);
    return cond;
  }

  // ── selector ──

  function defineSelector<T>(
    name: string,
    select: (state: S) => T,
  ): Selector<S, T> {
    if (selectorNames.has(name)) {
      throw new Error(
        `[defineApp:${appId}] Selector "${name}" already defined`,
      );
    }
    selectorNames.add(name);
    const sel = {
      name,
      select,
      [__selectorBrand]: true as const,
    } as unknown as Selector<S, T>;
    selectorRegistry.push(sel as Selector<S, unknown>);
    return sel;
  }

  // ── command (shared: app-level + zone-level) ──
  // Wraps flat handler → curried handler for kernel

  function registerCommand<T extends string, P = void>(
    type: T,
    handler: FlatHandler<S, P>,
    opts?: { when?: Condition<S> },
    group?: ReturnType<typeof slice.group>,
  ): CommandFactory<T, P> {
    // Track for test instance
    flatHandlerRegistry.set(type, { handler, when: opts?.when });

    // Wrap flat → curried for kernel
    const kernelHandler = (ctx: { state: S }) => (payload: P) =>
      handler(ctx, payload);

    // Register on kernel group with when guard
    const targetGroup = group ?? slice.group;
    const whenGuard = opts?.when
      ? { when: (state: unknown) => opts.when!.evaluate(state as S) }
      : undefined;

    const factory = targetGroup.defineCommand(
      type,
      kernelHandler as any,
      whenGuard as any,
    ) as unknown as CommandFactory<T, P>;

    // Track for v3 test compat
    allCommandFactories.set(type, factory);

    return factory;
  }

  // ── createZone ──

  function createZone(
    zoneName: string,
    parentGroup?: ReturnType<typeof slice.group>,
  ): ZoneHandle<S> {
    const scope = defineScope(`${appId}:${zoneName}`);
    const zoneGroup = (parentGroup ?? slice.group).group({ scope });

    // History middleware must run wherever commands are handled.
    // Zone commands run in this child scope, so we register here too.
    if (enableHistory) {
      const historyMw = createHistoryMiddleware(appId, scope);
      zoneGroup.use(historyMw);
    }

    const zone: ZoneHandle<S> = {
      command<T extends string, P = void>(
        type: T,
        handler: FlatHandler<S, P>,
        opts?: { when?: Condition<S> },
      ): CommandFactory<T, P> {
        return registerCommand(type, handler, opts, zoneGroup);
      },

      createZone(childName: string): ZoneHandle<S> {
        return createZone(`${zoneName}:${childName}`, zoneGroup);
      },

      bind(
        config: ZoneBindings & {
          field?: FieldBindings;
          keybindings?: KeybindingEntry<S>[];
        },
      ): BoundComponents<S> {
        return createBoundComponents(
          { appId, zoneName, useComputed: slice.useComputed },
          config,
        );
      },
    };

    return zone;
  }

  // ── create (test instance) ──

  function create(
    overrides?: Partial<S> | { history?: boolean },
  ): TestInstance<S> {
    return createTestInstance(
      { appId, initialState, flatHandlerRegistry, options },
      overrides,
    );
  }


  // ── Return AppHandle (v5 + v3 compat) ──

  return {
    condition: defineCondition,
    selector: defineSelector,

    command<T extends string, P = void>(
      type: T,
      handler: FlatHandler<S, P>,
      opts?: { when?: Condition<S> },
    ): CommandFactory<T, P> {
      return registerCommand(type, handler, opts);
    },

    createZone(name: string): ZoneHandle<S> {
      return createZone(name);
    },

    createTrigger: ((commandOrConfig: any): any => {
      // ── Simple trigger ──
      if (typeof commandOrConfig === "function") {
        return createSimpleTrigger(appId, commandOrConfig);
      }
      // ── Compound trigger (Dialog pattern) — v3 compat ──
      return createCompoundTrigger(appId, commandOrConfig);
    }) as {
      (
        command: CommandFactory<string, any>,
      ): React.FC<{
        payload?: any;
        children: ReactNode;
      }>;
      (config: {
        id?: string;
        confirm?: CommandFactory<string, any>;
      }): {
        Root: React.FC<{ children: ReactNode }>;
        Trigger: React.FC<{
          children: ReactNode;
          className?: string;
          asChild?: boolean;
        }>;
        Portal: React.FC<{
          children: ReactNode;
          title?: string;
          description?: string;
          className?: string;
          contentClassName?: string;
        }>;
        Content: React.FC<{
          children: ReactNode;
          title?: string;
          className?: string;
          zoneClassName?: string;
        }>;
        Dismiss: React.FC<{ children: ReactNode; className?: string }>;
        Confirm: React.FC<{ children: ReactNode; className?: string }>;
      };
    },

    /** v5: Selector-based hook */
    useComputed<T>(selectorOrFn: Selector<S, T> | ((s: S) => T)): T {
      if (__selectorBrand in (selectorOrFn as any)) {
        return slice.useComputed((s) =>
          (selectorOrFn as Selector<S, T>).select(s),
        );
      }
      // v3 compat: bare lambda
      return slice.useComputed(selectorOrFn as (s: S) => T);
    },

    useCondition(condition: Condition<S>): boolean {
      return slice.useComputed((s) => condition.evaluate(s));
    },

    /** v3 compat: read state */
    getState(): S {
      return slice.getState();
    },

    /** v3 compat: direct state update (callback-based handlers like onCommit) */
    setState(updater: (prev: S) => S) {
      slice.setState(updater);
    },

    /** All registered commands across all zones */
    get commands() {
      return Object.fromEntries(
        [...flatHandlerRegistry.keys()].map((type) => [type, null]),
      );
    },

    create,

    conditions() {
      return conditionRegistry;
    },

    selectors() {
      return selectorRegistry;
    },

    // ═══════════════════════════════════════════════════════════════
    // v3 COMPAT: createWidget
    // Adapts v3 widget pattern → v5 createZone + bind
    // ═══════════════════════════════════════════════════════════════

    createWidget<C extends Record<string, CommandFactory<any, any>>>(
      widgetName: string,
      factory: (define: {
        command(
          type: string,
          ...args: any[]
        ): CommandFactory<string, any> & { when: any };
      }) => {
        commands: C;
        zone?: any;
        field?: any;
        keybindings?: any[];
      },
    ): any {
      return createWidgetFactory(
        { createZone, registerCommand, defineCondition },
        widgetName,
        factory,
      );
    },
  };
}
