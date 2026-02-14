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
import type { CommandFactory, ScopeToken } from "@kernel/core/tokens";
import { OS } from "@os/AntigravityOS";
import { Keybindings as KeybindingsRegistry } from "@os/keymaps/keybindings";
import React, { type ReactNode } from "react";
import { registerAppSlice } from "./appSlice";

// ═══════════════════════════════════════════════════════════════════
// Brand Symbols
// ═══════════════════════════════════════════════════════════════════

const __conditionBrand = Symbol("condition");
const __selectorBrand = Symbol("selector");

// ═══════════════════════════════════════════════════════════════════
// Branded Types
// ═══════════════════════════════════════════════════════════════════

/** Branded Condition — named boolean predicate for when guards */
export type Condition<S> = {
  readonly name: string;
  readonly evaluate: (state: S) => boolean;
  readonly [__conditionBrand]: true;
};

/** Branded Selector — named data derivation */
export type Selector<S, T> = {
  readonly name: string;
  readonly select: (state: S) => T;
  readonly [__selectorBrand]: true;
};

// ═══════════════════════════════════════════════════════════════════
// Handler Types
// ═══════════════════════════════════════════════════════════════════

type CommandContext<S> = { readonly state: S };
type HandlerResult<S> = { state: S; dispatch?: any } | void;

/** Flat handler: (ctx, payload) => result */
type FlatHandler<S, P> = (ctx: CommandContext<S>, payload: P) => HandlerResult<S>;

// ═══════════════════════════════════════════════════════════════════
// Zone Bindings
// ═══════════════════════════════════════════════════════════════════

interface ZoneBindings {
  role: string;
  onCheck?: CommandFactory<any, any>;
  onAction?: CommandFactory<any, any>;
  onDelete?: CommandFactory<any, any>;
  onCopy?: CommandFactory<any, any>;
  onCut?: CommandFactory<any, any>;
  onPaste?: CommandFactory<any, any>;
  onMoveUp?: CommandFactory<any, any>;
  onMoveDown?: CommandFactory<any, any>;
  onUndo?: CommandFactory<any, any>;
  onRedo?: CommandFactory<any, any>;
}

interface FieldBindings {
  onChange?: CommandFactory<any, any>;
  onSubmit?: CommandFactory<any, any>;
  onCancel?: CommandFactory<any, any>;
}

interface KeybindingEntry<S> {
  key: string;
  command: CommandFactory<any, any>;
  when?: Condition<S>;
}

// ═══════════════════════════════════════════════════════════════════
// Bound Components (returned by bind)
// ═══════════════════════════════════════════════════════════════════

export interface BoundComponents<S> {
  Zone: React.FC<{ id?: string; className?: string; children?: ReactNode }>;
  Item: React.FC<{
    id: string | number;
    className?: string;
    children?: ReactNode;
    asChild?: boolean;
  }>;
  Field: React.FC<{
    name: string;
    value?: string;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
    blurOnInactive?: boolean;
  }>;
  When: React.FC<{ condition: Condition<S>; children?: ReactNode }>;
}

// ═══════════════════════════════════════════════════════════════════
// ZoneHandle
// ═══════════════════════════════════════════════════════════════════

export interface ZoneHandle<S> {
  command<T extends string, P = void>(
    type: T,
    handler: FlatHandler<S, P>,
    options?: { when?: Condition<S> },
  ): CommandFactory<T, P>;

  createZone(name: string): ZoneHandle<S>;

  bind(
    config: ZoneBindings & {
      field?: FieldBindings;
      keybindings?: KeybindingEntry<S>[];
    },
  ): BoundComponents<S>;
}

// ═══════════════════════════════════════════════════════════════════
// TestInstance
// ═══════════════════════════════════════════════════════════════════

export interface TestInstance<S> {
  readonly state: S;
  dispatch(command: any): boolean;
  reset(): void;
  evaluate(condition: Condition<S>): boolean;
  select<T>(selector: Selector<S, T>): T;
}

// ═══════════════════════════════════════════════════════════════════
// AppHandle
// ═══════════════════════════════════════════════════════════════════

export interface AppHandle<S> {
  condition(name: string, predicate: (state: S) => boolean): Condition<S>;
  selector<T>(name: string, select: (state: S) => T): Selector<S, T>;
  command<T extends string, P = void>(
    type: T,
    handler: FlatHandler<S, P>,
    options?: { when?: Condition<S> },
  ): CommandFactory<T, P>;
  createZone(name: string): ZoneHandle<S>;
  createTrigger(command: CommandFactory<string, any>): React.FC<{
    payload?: any;
    children: ReactNode;
  }>;
  useComputed<T>(selector: Selector<S, T>): T;
  useCondition(condition: Condition<S>): boolean;
  getState(): S;
  create(overrides?: Partial<S>): TestInstance<S>;
  conditions(): readonly Condition<S>[];
  selectors(): readonly Selector<S, unknown>[];
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
    /** v3 compat: named selectors for test instance select proxy */
    selectors?: Record<string, (state: S, ...args: any[]) => any>;
  },
): AppHandle<S> & { [key: string]: any } {
  // ── Production: register on singleton kernel ──
  const slice = registerAppSlice<S>(appId, {
    initialState,
    history: options?.history ?? undefined,
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
      throw new Error(`[defineApp:${appId}] Condition "${name}" already defined`);
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
      throw new Error(`[defineApp:${appId}] Selector "${name}" already defined`);
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
        // ── Zone component ──
        const ZoneComponent: React.FC<{
          id?: string;
          className?: string;
          children?: ReactNode;
        }> = ({ id, className, children }) => {
          const zoneProps: Record<string, any> = {
            id: id ?? zoneName,
            className,
            role: config.role,
          };

          // Map zone bindings → OS.Zone event props
          const eventMap: Record<string, string> = {
            onCheck: "onCheck",
            onAction: "onAction",
            onDelete: "onDelete",
            onCopy: "onCopy",
            onCut: "onCut",
            onPaste: "onPaste",
            onMoveUp: "onMoveUp",
            onMoveDown: "onMoveDown",
            onUndo: "onUndo",
            onRedo: "onRedo",
          };

          for (const [declKey, propKey] of Object.entries(eventMap)) {
            const cmd = (config as any)[declKey];
            if (cmd) {
              zoneProps[propKey] = cmd({ id: OS.FOCUS });
            }
          }

          // Keybindings registration
          React.useEffect(() => {
            if (!config.keybindings || config.keybindings.length === 0) return;
            const bindings = config.keybindings.map((kb) => ({
              key: kb.key,
              command: kb.command,
              args: [{ id: "OS.FOCUS" }],
              when: "navigating" as const,
            }));
            return KeybindingsRegistry.registerAll(bindings);
          }, []);

          return React.createElement(OS.Zone, zoneProps as any, children);
        };
        ZoneComponent.displayName = `${appId}.${zoneName}.Zone`;

        // ── Item component ──
        const ItemComponent: React.FC<{
          id: string | number;
          className?: string;
          children?: ReactNode;
          asChild?: boolean;
        }> = ({ id, className, children, asChild }) => {
          return React.createElement(
            OS.Item,
            { id: String(id), className, asChild } as any,
            children,
          );
        };
        ItemComponent.displayName = `${appId}.${zoneName}.Item`;

        // ── Field component ──
        const FieldComponent: React.FC<{
          name: string;
          value?: string;
          placeholder?: string;
          className?: string;
          autoFocus?: boolean;
          blurOnInactive?: boolean;
        }> = (props) => {
          const fieldProps: Record<string, any> = { ...props };

          if (config.field) {
            if (config.field.onChange)
              fieldProps["onChange"] = config.field.onChange;
            if (config.field.onSubmit)
              fieldProps["onSubmit"] = config.field.onSubmit;
            if (config.field.onCancel) {
              // onCancel may be a CommandFactory (function) or a BaseCommand (object)
              const cancel = config.field.onCancel;
              fieldProps["onCancel"] =
                typeof cancel === "function" ? cancel() : cancel;
            }
          }

          return React.createElement(OS.Field, fieldProps as any);
        };
        FieldComponent.displayName = `${appId}.${zoneName}.Field`;

        // ── When component ──
        const WhenComponent: React.FC<{
          condition: Condition<S>;
          children?: ReactNode;
        }> = ({ condition, children }) => {
          const value = slice.useComputed((s) => condition.evaluate(s));
          return value
            ? React.createElement(React.Fragment, null, children)
            : null;
        };
        WhenComponent.displayName = `${appId}.${zoneName}.When`;

        return {
          Zone: ZoneComponent,
          Item: ItemComponent,
          Field: FieldComponent,
          When: WhenComponent,
        };
      },
    };

    return zone;
  }

  // ── create (test instance) ──

  function create(overrides?: Partial<S>): TestInstance<S> {
    interface TestAppState {
      os: Record<string, never>;
      apps: Record<string, unknown>;
    }

    const testState = overrides
      ? { ...initialState, ...overrides }
      : initialState;

    const testKernel = createKernel<TestAppState>({
      os: {} as Record<string, never>,
      apps: { [appId]: testState },
    });

    const testScope = defineScope(appId);
    const testGroup = testKernel.group({
      scope: testScope,
      stateSlice: {
        get: (full: TestAppState) => full.apps[appId] as S,
        set: (full: TestAppState, s: unknown) => ({
          ...full,
          apps: { ...full.apps, [appId]: s },
        }),
      },
    });

    // Re-register all commands on test kernel, collecting test factories
    const testFactories = new Map<string, CommandFactory<any, any>>();
    for (const [type, entry] of flatHandlerRegistry) {
      const kernelHandler = (ctx: { state: S }) => (payload: any) =>
        entry.handler(ctx, payload);

      const whenGuard = entry.when
        ? { when: (state: unknown) => entry.when!.evaluate(state as S) }
        : undefined;

      const testFactory = testGroup.defineCommand(
        type,
        kernelHandler as any,
        whenGuard as any,
      );
      testFactories.set(type, testFactory);
    }

    // ── v3 compat: Build dispatch proxy ──
    const dispatchProxy: Record<string, (payload?: any) => void> = {};
    for (const [type] of flatHandlerRegistry) {
      dispatchProxy[type] = (payload?: any) => {
        const factory = testFactories.get(type);
        if (factory) {
          testKernel.dispatch((factory as any)(payload ?? {}));
        }
      };
    }

    // ── v3 compat: Build select proxy ──
    const selectProxy: Record<string, (...args: any[]) => any> = {};
    if (options?.selectors) {
      for (const [name, selectorFn] of Object.entries(options.selectors)) {
        selectProxy[name] = (...args: any[]) => {
          const appState = testKernel.getState().apps[appId] as S;
          return selectorFn(appState, ...args);
        };
      }
    }

    // ── v3 compat: Build commands map with `when` metadata ──
    const commandsMap: Record<string, any> = {};
    for (const [type, entry] of flatHandlerRegistry) {
      const factory = testFactories.get(type);
      if (factory) {
        commandsMap[type] = factory;
        (commandsMap[type] as any).when = entry.when
          ? (state: any) => entry.when!.evaluate(state)
          : null;
      }
    }

    return {
      get state() {
        return testKernel.getState().apps[appId] as S;
      },

      dispatch: Object.assign(
        (command: any): boolean => {
          // v5 style: dispatch(command)
          const entry = flatHandlerRegistry.get(command.type);
          if (entry?.when) {
            const currentState = testKernel.getState().apps[appId] as S;
            if (!entry.when.evaluate(currentState)) return false;
          }
          // Redirect to test scope — zone commands carry production scope
          // (e.g., ['todo-v5:list']) but test kernel uses single test scope
          const normalizedCmd = {
            ...command,
            scope: [testScope],
          };
          testKernel.dispatch(normalizedCmd);
          return true;
        },
        // v3 style: dispatch.addTodo({...})
        dispatchProxy,
      ),

      // Dual: v5 select(brandedSelector) + v3 select.visibleTodos()
      select: Object.assign(
        (selectorOrBranded: any) => {
          // v5 style: select(brandedSelector)
          if (selectorOrBranded && __selectorBrand in selectorOrBranded) {
            const currentState = testKernel.getState().apps[appId] as S;
            return selectorOrBranded.select(currentState);
          }
          return undefined;
        },
        selectProxy,
      ) as any,

      // v3 style: commands.cancelEdit
      commands: commandsMap,

      reset() {
        testKernel.setState(() => ({
          os: {} as Record<string, never>,
          apps: { [appId]: testState },
        }));
      },

      evaluate(condition: Condition<S>): boolean {
        const currentState = testKernel.getState().apps[appId] as S;
        return condition.evaluate(currentState);
      },
    } as any;
  }

  // ── createTrigger ──

  function createTrigger(
    command: CommandFactory<string, any>,
  ): React.FC<{ payload?: any; children: ReactNode }> {
    const SimpleTrigger: React.FC<{ payload?: any; children: ReactNode }> = ({
      payload,
      children,
    }) => {
      return React.createElement(
        OS.Trigger as any,
        { onPress: command(payload ?? {}) },
        children,
      );
    };
    SimpleTrigger.displayName = `${appId}.Trigger`;
    return SimpleTrigger;
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
        return createTrigger(commandOrConfig);
      }
      // ── Compound trigger (Dialog pattern) — v3 compat ──
      const config = commandOrConfig as {
        id?: string;
        confirm?: CommandFactory<string, any>;
      };
      const dialogId = config.id ?? `${appId}-dialog-${Date.now()}`;

      const RootComponent: React.FC<{ children: ReactNode }> = ({
        children,
      }) =>
        React.createElement(OS.Dialog as any, { id: dialogId }, children);
      RootComponent.displayName = `${appId}.Dialog`;

      const TriggerComponent: React.FC<{
        children: ReactNode;
        className?: string;
        asChild?: boolean;
      }> = ({ children, className, asChild }) =>
          React.createElement(
            (OS.Dialog as any).Trigger,
            { className, asChild },
            children,
          );
      TriggerComponent.displayName = `${appId}.Dialog.Trigger`;

      const ContentComponent: React.FC<{
        children: ReactNode;
        title?: string;
        className?: string;
        zoneClassName?: string;
      }> = (props) =>
          React.createElement((OS.Dialog as any).Content, props as any);
      ContentComponent.displayName = `${appId}.Dialog.Content`;

      const PortalComponent: React.FC<{
        children: ReactNode;
        title?: string;
        description?: string;
        className?: string;
        contentClassName?: string;
      }> = (props) =>
          React.createElement((OS.Trigger as any).Portal, props as any);
      PortalComponent.displayName = `${appId}.Dialog.Portal`;

      const DismissComponent: React.FC<{
        children: ReactNode;
        className?: string;
      }> = ({ children, className }) =>
          React.createElement(
            (OS.Dialog as any).Close,
            { className },
            children,
          );
      DismissComponent.displayName = `${appId}.Dialog.Dismiss`;

      const ConfirmComponent: React.FC<{
        children: ReactNode;
        className?: string;
      }> = ({ children, className }) => {
        const confirmCmd = config.confirm
          ? config.confirm({} as any)
          : undefined;
        return React.createElement(
          (OS.Dialog as any).Close,
          { className, onPress: confirmCmd },
          children,
        );
      };
      ConfirmComponent.displayName = `${appId}.Dialog.Confirm`;

      return {
        Root: RootComponent,
        Trigger: TriggerComponent,
        Portal: PortalComponent,
        Content: ContentComponent,
        Dismiss: DismissComponent,
        Confirm: ConfirmComponent,
      };
    }) as {
      (command: CommandFactory<string, any>): React.FC<{
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
      const zone = createZone(widgetName);

      // Build v3-style define API
      const widgetDefine = {
        command(type: string, ...args: any[]) {
          // Support: (type, deps, handler, options?) and (type, handler, options?)
          let handler: any;
          let cmdOptions: any;

          if (args.length >= 2 && Array.isArray(args[0])) {
            // (type, deps, handler, options?)
            handler = args[1];
            cmdOptions = args[2];
          } else {
            // (type, handler, options?)
            handler = args[0];
            cmdOptions = args[1];
          }

          // v3 handler is curried: (ctx) => (payload) => result
          // Wrap to flat: (ctx, payload) => result
          const flatHandler: FlatHandler<S, any> = (ctx, payload) =>
            handler(ctx)(payload);

          // v3 when is bare lambda, not Condition
          const whenCondition = cmdOptions?.when
            ? defineCondition(
              `__v3_when_${type}`,
              cmdOptions.when as (state: S) => boolean,
            )
            : undefined;

          const factory = registerCommand(type, flatHandler, {
            when: whenCondition,
          });

          // v3 compat: attach when metadata
          (factory as any).when = cmdOptions?.when ?? null;

          return factory as any;
        },
      };

      // Run factory
      const config = factory(widgetDefine as any);

      // Build bound components
      const bound = zone.bind({
        role: config.zone?.role ?? "group",
        ...config.zone,
        field: config.field,
        keybindings: config.keybindings?.map((kb: any) => ({
          key: kb.key,
          command: kb.command,
        })),
      });

      return {
        Zone: bound.Zone,
        Item: bound.Item,
        Field: bound.Field,
        When: bound.When,
        // v3: Keybindings component (standalone, for widgets without Zone)
        Keybindings: ((props: { children?: ReactNode }) => {
          React.useEffect(() => {
            if (!config.keybindings || config.keybindings.length === 0) return;
            const bindings = config.keybindings.map((kb: any) => ({
              key: kb.key,
              command: kb.command,
              args: [{ id: "OS.FOCUS" }],
              when: kb.when ?? ("navigating" as const),
            }));
            return KeybindingsRegistry.registerAll(bindings);
          }, []);
          return React.createElement(React.Fragment, null, props.children);
        }) as React.FC<{ children?: ReactNode }>,
        commands: config.commands,
      };
    },
  };
}
