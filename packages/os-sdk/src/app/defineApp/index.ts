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
import { Keybindings } from "@os-core/2-resolve/keybindings";
import { registerAppSlice } from "@os-core/engine/appState";
import { createHistoryMiddleware } from "@os-core/engine/middlewares/historyKernelMiddleware";
import type React from "react";
import type { ReactNode } from "react";
import type { AppModule } from "../modules/types";
import { createBoundComponents } from "./bind";
import { createTestInstance } from "./testInstance";
import {
  type CompoundTriggerComponents,
  type CompoundTriggerConfig,
  createCompoundTrigger,
  createDynamicTrigger,
  createSimpleTrigger,
  type TriggerOptions,
} from "./trigger";
import {
  __conditionBrand,
  __selectorBrand,
  type AppHandle,
  type AppKeybindingEntry,
  type BoundComponents,
  type Condition,
  type FieldBindings,
  type FlatHandler,
  type Selector,
  type TestInstance,
  type TriggerBinding,
  type ZoneBindingEntry,
  type ZoneBindings,
  type ZoneHandle,
} from "./types";

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
    modules?: AppModule[];
  },
): AppHandle<S> {
  // ── Production: register on singleton kernel ──
  const modules = options?.modules ?? [];
  // Backward compat: history/persistence boolean config still works
  const enableHistory =
    options?.history ?? modules.some((m) => m.id === "history");
  const slice = registerAppSlice<S>(appId, {
    initialState,
    ...(enableHistory ? { history: true } : {}),
    ...(options?.persistence ? { persistence: options.persistence } : {}),
    modules,
  });

  // ── Registries ──
  const conditionNames = new Set<string>();
  const selectorNames = new Set<string>();

  // For test instance: track all flat handlers + when guards
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous handler storage requires any for contravariant P
  const flatHandlerRegistry = new Map<
    string,
    { handler: FlatHandler<S, any>; when?: Condition<S> }
  >();

  // For AppPage: track zone bindings (onAction, onDelete, etc.)
  const zoneBindingEntries = new Map<
    string,
    {
      role: import("@os-core/engine/registries/roleRegistry").ZoneRole;
      bindings: ZoneBindings;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      keybindings?: { key: string; command: any; when?: unknown }[];
      field?: import("./types").FieldBindings;
      triggers?: import("./types").TriggerBinding[];
    }
  >();

  // For headless: track command-level keybindings (both app + zone)
  const commandKeybindingEntries: AppKeybindingEntry[] = [];

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
    opts?: {
      when?: Condition<S> | "editing" | "navigating";
      key?: string | string[];
    },
    group?: typeof slice.group,
  ): CommandFactory<T, P> {
    // Extract Condition<S> for dispatch guard (ignore string when guards)
    const conditionWhen =
      opts?.when && typeof opts.when !== "string" ? opts.when : undefined;

    // Track for test instance
    flatHandlerRegistry.set(type, {
      handler,
      ...(conditionWhen ? { when: conditionWhen } : {}),
    });

    // Wrap flat → curried for kernel (readonly state matches TypedContext)
    const kernelHandler = (ctx: { readonly state: S }) => (payload: P) =>
      handler(ctx, payload);

    // Register on kernel group with when guard
    const targetGroup = group ?? slice.group;
    const whenGuard = conditionWhen
      ? { when: (state: S) => conditionWhen.evaluate(state) }
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

    // Auto-register keybinding if key is specified
    if (opts?.key) {
      const keys = Array.isArray(opts.key) ? opts.key : [opts.key];
      const keyWhen = typeof opts.when === "string" ? opts.when : undefined;
      const command = (
        factory as unknown as () => unknown
      )() as import("@kernel/core/tokens").BaseCommand;
      for (const k of keys) {
        const entry: AppKeybindingEntry = {
          key: k,
          command,
          ...(keyWhen ? { when: keyWhen } : {}),
        };
        commandKeybindingEntries.push(entry);
        Keybindings.registerAll([entry]);
      }
    }

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

    // Install modules on zone scope (scoped middleware)
    for (const mod of modules) {
      // Skip history module — already handled above with dedicated logic
      if (mod.id === "history") continue;
      const mws = mod.install({ appId, scope });
      const mwArr = Array.isArray(mws) ? mws : [mws];
      for (const mw of mwArr) {
        zoneGroup.use(mw);
      }
    }

    const zone: ZoneHandle<S> = {
      command<T extends string, P = void>(
        type: T,
        handler: FlatHandler<S, P>,
        opts?: {
          when?: Condition<S> | "editing" | "navigating";
          key?: string | string[];
        },
      ): CommandFactory<T, P> {
        return registerCommand(type, handler, opts, zoneGroup);
      },

      defineEffect<V>(type: string, handler: (value: V) => void): void {
        zoneGroup.defineEffect(type, handler);
      },

      createZone(childName: string): ZoneHandle<S> {
        return createZone(`${zoneName}:${childName}`, zoneGroup);
      },

      trigger(
        id: string,
        commandOrFactory:
          | import("@kernel/core/tokens").BaseCommand
          | import("@kernel/core/tokens").CommandFactory<string, unknown>,
      ): TriggerBinding {
        // typeof detection: function → factory (cursor auto-bind), object → command as-is
        const onActivate =
          typeof commandOrFactory === "function"
            ? (commandOrFactory as (focusId: string) => import("@kernel/core/tokens").BaseCommand)
            : commandOrFactory;
        return { id, onActivate };
      },

      overlay(
        id: string,
        config: import("@os-sdk/app/defineApp/types").ZoneOverlayConfig,
      ): CompoundTriggerComponents {
        return createCompoundTrigger(appId, { ...config, id });
      },

      bind(
        config: ZoneBindings & {
          field?: FieldBindings;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          keybindings?: { key: string; command: any; when?: unknown }[];
          options?: import("@os-react/6-project/Zone").ZoneOptions;
          itemFilter?: (items: string[]) => string[];
        },
      ): BoundComponents<S> {
        // Track zone bindings for AppPage
        zoneBindingEntries.set(zoneName, {
          role: config.role,
          bindings: config,
          keybindings: config.keybindings ?? [],
          ...(config.field !== undefined ? { field: config.field } : {}),
          ...(config.triggers !== undefined
            ? { triggers: config.triggers }
            : {}),
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
    overrides?: Partial<S> | { history?: boolean; withOS?: boolean },
  ): TestInstance<S> {
    return createTestInstance(
      { appId, initialState, flatHandlerRegistry, modules },
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
      opts?: {
        when?: Condition<S> | "editing" | "navigating";
        key?: string | string[];
      },
    ): CommandFactory<T, P> {
      return registerCommand(type, handler, opts);
    },

    defineEffect<V>(type: string, handler: (value: V) => void): void {
      slice.group.defineEffect(type, handler);
    },

    createZone(name: string): ZoneHandle<S> {
      return createZone(name);
    },

    createTrigger: ((
      commandOrConfig:
        | BaseCommand
        | CompoundTriggerConfig
        | CommandFactory<string, unknown>,
      options?: TriggerOptions,
    ) => {
      // ── CommandFactory (Dynamic Trigger) ──
      if (typeof commandOrConfig === "function") {
        return createDynamicTrigger(
          appId,
          commandOrConfig as CommandFactory<string, unknown>,
          options,
        );
      }
      // ── Simple trigger (BaseCommand has .type) ──
      if (
        commandOrConfig &&
        typeof (commandOrConfig as BaseCommand).type === "string"
      ) {
        return createSimpleTrigger(
          appId,
          commandOrConfig as BaseCommand,
          options,
        );
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
        options?: TriggerOptions,
      ): React.FC<
        P extends void
          ? { children: ReactNode; payload?: never }
          : { children: ReactNode; payload: P }
      >;
      /* Command Overload: Returns simple component */
      (
        command: BaseCommand,
        options?: TriggerOptions,
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

    keybindings(entries: AppKeybindingEntry[]): void {
      // Escape hatch for non-command keybindings
      commandKeybindingEntries.push(...entries);
      Keybindings.registerAll(entries);
    },

    // ── Internal (for OS-level createPage) ──
    __appId: appId,
    __zoneBindings: zoneBindingEntries as Map<string, ZoneBindingEntry>,
    __appKeybindings: commandKeybindingEntries,
  };
}
