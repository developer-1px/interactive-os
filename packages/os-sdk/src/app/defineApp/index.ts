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
import type { CommandFactory } from "@kernel/core/tokens";
import { Keybindings } from "@os-core/2-resolve/keybindings";
import { registerAppSlice } from "@os-core/engine/appState";
import { createHistoryMiddleware } from "@os-core/engine/middlewares/historyKernelMiddleware";
import { TriggerOverlayRegistry } from "@os-core/engine/registries/triggerRegistry";
import type React from "react";
import type { AppModule } from "../modules/types";
import { createBoundComponents } from "./bind";
import { createTestInstance } from "./testInstance";
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

      overlay(
        id: string,
        config: import("@os-sdk/app/defineApp/types").ZoneOverlayConfig,
      ): import("@os-sdk/app/defineApp/types").OverlayHandle {
        const triggerId = `${id}-trigger`;
        const role = config.role ?? "dialog";

        // Register trigger→overlay relationship for headless ARIA
        TriggerOverlayRegistry.set(triggerId, id, role);

        return {
          overlayId: id,
          trigger: <T extends HTMLElement>(payload?: string) =>
            ({
              "data-trigger-id": triggerId,
              "aria-haspopup": role === "menu" ? "true" : (role as string),
              "aria-controls": id,
              ...(payload !== undefined
                ? { "data-trigger-payload": payload }
                : {}),
            }) as React.HTMLAttributes<T> & {
              "data-trigger-id": string;
              "aria-haspopup"?: string;
              "aria-controls"?: string;
            },
        };
      },

      bind<
        TriggerMap extends Record<
          string,
          (focusId: string) => import("@kernel/core/tokens").BaseCommand
        > = Record<string, never>,
      >(
        config: Omit<ZoneBindings, "triggers"> & {
          field?: FieldBindings;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          keybindings?: { key: string; command: any; when?: unknown }[];
          options?: import("@os-react/6-project/Zone").ZoneOptions;
          itemFilter?: (items: string[]) => string[];
          /** Triggers: object map {Name: callback} */
          triggers?: TriggerMap;
        },
      ): BoundComponents<S> & {
        triggers: {
          [K in keyof TriggerMap]: <T extends HTMLElement>(
            payload?: string,
          ) => React.HTMLAttributes<T>;
        };
      } {
        // Normalize triggers: object map → TriggerBinding[] + prop-getter map
        let triggerBindings: TriggerBinding[] | undefined;
        const triggerGetters: Record<
          string,
          <T extends HTMLElement>(payload?: string) => React.HTMLAttributes<T>
        > = {};

        if (config.triggers) {
          triggerBindings = [];
          const map = config.triggers;
          for (const [key, onActivate] of Object.entries(map)) {
            triggerBindings.push({
              id: key,
              onActivate: onActivate as (
                focusId: string,
              ) => import("@kernel/core/tokens").BaseCommand,
            });
            triggerGetters[key] = <T extends HTMLElement>(payload?: string) =>
              ({
                "data-trigger-id": key,
                ...(payload !== undefined
                  ? { "data-trigger-payload": payload }
                  : {}),
              }) as React.HTMLAttributes<T> & { "data-trigger-id": string };
          }
        }

        // Build normalized config for createBoundComponents
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { triggers: _rawTriggers, ...restConfig } = config;
        const normalizedConfig = {
          ...restConfig,
          ...(triggerBindings ? { triggers: triggerBindings } : {}),
        };

        // Track zone bindings for AppPage
        zoneBindingEntries.set(zoneName, {
          role: config.role,
          bindings: normalizedConfig,
          keybindings: config.keybindings ?? [],
          ...(config.field !== undefined ? { field: config.field } : {}),
          ...(triggerBindings !== undefined
            ? { triggers: triggerBindings }
            : {}),
        });

        const components = createBoundComponents(
          { appId, zoneName, useComputed: slice.useComputed },
          normalizedConfig,
        );

        // Return components + trigger prop-getters
        return {
          ...components,
          triggers: triggerGetters as {
            [K in keyof TriggerMap]: <T extends HTMLElement>(
              payload?: string,
            ) => React.HTMLAttributes<T>;
          },
        };
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
