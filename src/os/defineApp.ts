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

import { defineScope } from "@kernel";
import type { BaseCommand, CommandFactory } from "@kernel/core/tokens";
import type React from "react";
import type { ReactNode } from "react";
import { registerAppSlice } from "./appSlice";
import { createBoundComponents } from "./defineApp.bind";
import { createTestInstance } from "./defineApp.testInstance";
import { createTestPage } from "./defineApp.page";
import {
  type CompoundTriggerComponents,
  type CompoundTriggerConfig,
  createCompoundTrigger,
  createDynamicTrigger,
  createSimpleTrigger,
} from "./defineApp.trigger";
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
  type TestInstance,
  type TestPage,
  type ZoneBindings,
  type ZoneHandle,
} from "./defineApp.types";

import { createHistoryMiddleware } from "./middlewares/historyKernelMiddleware";

// ═══════════════════════════════════════════════════════════════════
// Brand Type Factories (cast isolated here)
// ═══════════════════════════════════════════════════════════════════

function createCondition<S>(
  name: string,
  predicate: (state: S) => boolean,
): Condition<S> {
  return {
    name,
    evaluate: predicate,
    [__conditionBrand]: true as const,
  } as unknown as Condition<S>;
}

function createSelector<S, T>(
  name: string,
  select: (state: S) => T,
): Selector<S, T> {
  return {
    name,
    select,
    [__selectorBrand]: true as const,
  } as unknown as Selector<S, T>;
}

// ═══════════════════════════════════════════════════════════════════
// defineApp — Production Implementation
// ═══════════════════════════════════════════════════════════════════

export function defineApp<S>(
  appId: string,
  initialState: S,
  options?: {
    history?: boolean;
    persistence?: { key: string; debounceMs?: number };
  },
): AppHandle<S> {
  // ── Production: register on singleton kernel ──
  const enableHistory = options?.history ?? false;
  const slice = registerAppSlice<S>(appId, {
    initialState,
    ...(enableHistory ? { history: true } : {}),
    ...(options?.persistence ? { persistence: options.persistence } : {}),
  });

  // ── Registries ──
  const conditionNames = new Set<string>();
  const selectorNames = new Set<string>();

  // For test instance: track all flat handlers + when guards
  const flatHandlerRegistry = new Map<
    string,
    { handler: FlatHandler<S, any>; when?: Condition<S> }
  >();

  // For TestPage: track zone bindings (onAction, onDelete, etc.)
  const zoneBindingEntries = new Map<string, {
    role: import("./registries/roleRegistry").ZoneRole;
    bindings: ZoneBindings;
    keybindings?: import("./defineApp.types").KeybindingEntry<S>[];
  }>();

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
    return createCondition(name, predicate);
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
    return createSelector(name, select);
  }

  // ── command (shared: app-level + zone-level) ──
  // Wraps flat handler → curried handler for kernel

  function registerCommand<T extends string, P = void>(
    type: T,
    handler: FlatHandler<S, P>,
    opts?: { when?: Condition<S> },
    group?: typeof slice.group,
  ): CommandFactory<T, P> {
    // Track for test instance
    flatHandlerRegistry.set(type, {
      handler,
      ...(opts?.when ? { when: opts.when } : {}),
    });

    // Wrap flat → curried for kernel (readonly state matches TypedContext)
    const kernelHandler = (ctx: { readonly state: S }) => (payload: P) =>
      handler(ctx, payload);

    // Register on kernel group with when guard
    const targetGroup = group ?? slice.group;
    const whenGuard = opts?.when
      ? { when: (state: S) => opts.when!.evaluate(state) }
      : undefined;

    // defineApp's FlatHandler context `{ readonly state: S }` differs from kernel's
    // `TypedContext<S, InjectResult<Tokens>>`. Cast through the loose internal signature.
    const defineCmd = targetGroup.defineCommand as (
      type: string,
      handler: unknown,
      options?: unknown,
    ) => CommandFactory<string, unknown>;

    const factory = (whenGuard
      ? defineCmd(type, kernelHandler, whenGuard)
      : defineCmd(type, kernelHandler)) as unknown as CommandFactory<T, P>;

    return factory;
  }

  // ── createZone ──

  function createZone(
    zoneName: string,
    parentGroup?: typeof slice.group,
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
          options?: import("@os/6-components/primitives/Zone").ZoneOptions;
          itemFilter?: (items: string[]) => string[];
        },
      ): BoundComponents<S> {
        // Track zone bindings for TestPage
        zoneBindingEntries.set(zoneName, {
          role: config.role,
          bindings: config,
          keybindings: config.keybindings ?? [],
        });

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
      { appId, initialState, flatHandlerRegistry },
      overrides,
    );
  }

  // ── Return AppHandle ──

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

    createTrigger: ((
      commandOrConfig:
        | BaseCommand
        | CompoundTriggerConfig
        | CommandFactory<any, any>,
    ) => {
      // ── CommandFactory (Dynamic Trigger) ──
      if (typeof commandOrConfig === "function") {
        return createDynamicTrigger(
          appId,
          commandOrConfig as CommandFactory<any, any>,
        );
      }
      // ── Simple trigger (BaseCommand has .type) ──
      if (
        commandOrConfig &&
        typeof (commandOrConfig as BaseCommand).type === "string"
      ) {
        return createSimpleTrigger(appId, commandOrConfig as BaseCommand);
      }
      // ── Compound trigger (Dialog pattern) ──
      return createCompoundTrigger(
        appId,
        commandOrConfig as CompoundTriggerConfig,
      );
    }) as {
      /* Factory Overload: Returns component taking typed payload */
      <P = void>(
        factory: CommandFactory<string, P>,
      ): React.FC<
        P extends void
        ? { children: ReactNode; payload?: never }
        : { children: ReactNode; payload: P }
      >;
      /* Command Overload: Returns simple component */
      (
        command: BaseCommand,
      ): React.FC<{
        children: ReactNode;
      }>;
      /* Config Overload: Returns compound components */
      (config: CompoundTriggerConfig): CompoundTriggerComponents;
    },

    useComputed<T>(selectorOrFn: Selector<S, T> | ((s: S) => T)): T {
      if (
        typeof selectorOrFn === "object" &&
        selectorOrFn !== null &&
        "select" in selectorOrFn
      ) {
        return slice.useComputed((s) =>
          (selectorOrFn as Selector<S, T>).select(s),
        );
      }
      return slice.useComputed(selectorOrFn as (s: S) => T);
    },

    create,

    createPage(): TestPage<S> {
      return createTestPage<S>(
        appId,
        zoneBindingEntries,
      );
    },
  };
}
