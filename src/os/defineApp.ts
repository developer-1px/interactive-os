/**
 * defineApp — App Framework Layer (v3)
 *
 * Replaces createModule with a two-tier architecture:
 *   1. defineApp(appId, state) → { createWidget, create, useComputed }
 *   2. createWidget(name, factory) → { Zone, Item, Field, Trigger, commands }
 *
 * App owns state. Widgets declare Zone/Field bindings + commands.
 * Widgets share state via the App.
 *
 * @example
 *   const { createWidget } = defineApp("todo", INITIAL_STATE);
 *
 *   const TodoList = createWidget("list", (define) => {
 *     const toggleTodo = define.command("toggleTodo", handler);
 *     return {
 *       commands: { toggleTodo },
 *       zone: { role: "listbox", onCheck: toggleTodo },
 *     };
 *   });
 *
 *   // Widget usage:
 *   <TodoList.Zone>{children}</TodoList.Zone>
 *
 *   // Test:
 *   const app = TodoApp.create();
 *   app.dispatch.toggleTodo({ id: 1 });
 */

import { createKernel, defineScope } from "@kernel";
import type { CommandFactory } from "@kernel/core/tokens";
import { OS } from "@os/AntigravityOS";
import { Keybindings as KeybindingsRegistry } from "@os/keymaps/keybindings";
import React, { type ReactNode } from "react";
import { registerAppSlice } from "./appSlice";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

type HandlerReturn<S> = { state: S; dispatch?: any } | undefined;

type CommandHandler<S, P> = (ctx: {
  state: S;
}) => (payload: P) => HandlerReturn<S>;

/** Options for define.command — co-located metadata */
interface CommandOptions<S> {
  /** State predicate: command is executable only when this returns true.
   *  Consumed by Trigger (disabled), Keybindings (ignore), CommandPalette (grayed out). */
  when?: (state: S) => boolean;
}

/** Extended CommandFactory with `when` guard metadata */
type AppCommandFactory<S, P = void> = CommandFactory<string, P> & {
  /** State predicate for executability. null = always executable. */
  when: ((state: S) => boolean) | null;
};

interface WidgetDefine<S> {
  command<P = void>(
    type: string,
    deps: any[],
    handler: CommandHandler<S, P>,
    options?: CommandOptions<S>,
  ): AppCommandFactory<S, P>;

  command<P = void>(
    type: string,
    handler: CommandHandler<S, P>,
    options?: CommandOptions<S>,
  ): AppCommandFactory<S, P>;
}

type SelectorMap<S> = Record<string, (state: S, ...args: any[]) => any>;

// Zone event → command mapping
interface ZoneDeclaration {
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

// Field event → command mapping
interface FieldDeclaration {
  onChange?: CommandFactory<any, any>;
  onSubmit?: CommandFactory<any, any>;
  onCancel?: CommandFactory<any, any>;
}

// App-level keybinding declaration
interface KeybindingDeclaration {
  /** Canonical key string (e.g. "Meta+D", "Meta+Shift+V") */
  key: string;
  /** Command factory to invoke */
  command: CommandFactory<any, any>;
  /** Context guard (default: "navigating") */
  when?: "editing" | "navigating";
}

// Widget factory return type
interface WidgetConfig<C extends Record<string, CommandFactory<any, any>>> {
  commands: C;
  zone?: ZoneDeclaration;
  field?: FieldDeclaration;
  /** App-specific keybindings — registered on mount, unregistered on unmount */
  keybindings?: KeybindingDeclaration[];
}

// ═══════════════════════════════════════════════════════════════════
// Widget (returned by createWidget)
// ═══════════════════════════════════════════════════════════════════

interface Widget<_S, C extends Record<string, CommandFactory<any, any>>> {
  /** Pre-bound Zone component — no manual event binding needed */
  Zone: React.FC<{ id?: string; className?: string; children?: ReactNode }>;
  /** Item component for Zone items */
  Item: React.FC<{
    id: string | number;
    className?: string;
    children?: ReactNode;
    asChild?: boolean;
  }>;
  /** Pre-bound Field component — onChange/onSubmit/onCancel from declaration */
  Field: React.FC<{
    name: string;
    value?: string;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
    blurOnInactive?: boolean;
  }>;
  /** Keybinding registration — for widgets without Zone */
  Keybindings: React.FC<{ children?: ReactNode }>;
  /** Command factories */
  commands: C;
}

// ═══════════════════════════════════════════════════════════════════
// App Instance (for testing)
// ═══════════════════════════════════════════════════════════════════

interface AppInstance<
  S,
  AllC extends Record<string, CommandFactory<any, any>>,
  Sel extends SelectorMap<S>,
> {
  readonly state: S;
  dispatch: { [K in keyof AllC]: (payload?: any) => void };
  select: { [K in keyof Sel]: (...args: any[]) => ReturnType<Sel[K]> };
  commands: AllC;
  reset(): void;
}

// ═══════════════════════════════════════════════════════════════════
// defineApp
// ═══════════════════════════════════════════════════════════════════

export function defineApp<
  S,
  Sel extends SelectorMap<S> = Record<string, never>,
>(
  appId: string,
  initialState: S,
  options?: {
    history?: boolean;
    persistence?: { key: string; debounceMs?: number };
    selectors?: Sel;
  },
) {
  // ── Production: register on singleton kernel ──
  const slice = registerAppSlice<S>(appId, {
    initialState,
    history: options?.history ?? undefined,
    persistence: options?.persistence ?? undefined,
  } as any);

  // Collect all commands from all widgets
  const allCommands: Record<string, CommandFactory<any, any>> = {};
  const allWidgetFactories: Array<{
    name: string;
    factory: (define: WidgetDefine<S>) => WidgetConfig<any>;
  }> = [];

  // ── createWidget ──
  function createWidget<C extends Record<string, CommandFactory<any, any>>>(
    widgetName: string,
    factory: (define: WidgetDefine<S>) => WidgetConfig<C>,
  ): Widget<S, C> {
    // Build define API delegating to slice.group
    const widgetDefine: WidgetDefine<S> = {
      command(type: string, ...args: any[]) {
        // Support: (type, deps, handler, options?) and (type, handler, options?)
        let deps: any[];
        let handler: any;
        let options: CommandOptions<S> | undefined;

        if (args.length >= 2 && Array.isArray(args[0])) {
          // (type, deps, handler, options?)
          deps = args[0];
          handler = args[1];
          options = args[2];
        } else {
          // (type, handler, options?)
          deps = [];
          handler = args[0];
          options = args[1];
        }

        const factory = slice.group.defineCommand(type, deps, handler as any);

        // Attach `when` metadata to factory
        (factory as any).when = options?.when ?? null;

        return factory as any;
      },
    };

    // Run factory
    const config = factory(widgetDefine);

    // Store factory for test instance creation
    allWidgetFactories.push({ name: widgetName, factory });

    // Merge commands into app-level collection
    for (const [name, cmd] of Object.entries(config.commands)) {
      allCommands[name] = cmd;
    }

    // ── Build Zone component ──
    const ZoneComponent: React.FC<{
      id?: string;
      className?: string;
      children?: ReactNode;
    }> = ({ id, className, children }) => {
      const zoneProps: Record<string, any> = {
        id: id ?? widgetName,
        className,
      };

      if (config.zone) {
        zoneProps["role"] = config.zone.role;

        // Map zone declaration to OS.Zone event props
        // OS.FOCUS is a placeholder that gets resolved at runtime
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
          const cmd = (config.zone as any)[declKey];
          if (cmd) {
            // Commands that need focus ID get OS.FOCUS injected
            // Commands without payload (undo/redo) get called directly
            zoneProps[propKey] = cmd({ id: OS.FOCUS });
          }
        }
      }

      // Zone auto-registers keybindings (inline)
      // Widgets without Zone use standalone Keybindings component instead
      React.useEffect(() => {
        if (!config.keybindings || config.keybindings.length === 0) return;
        const bindings = config.keybindings.map((kb) => ({
          key: kb.key,
          command: kb.command,
          args: [{ id: "OS.FOCUS" }],
          when: kb.when ?? ("navigating" as const),
        }));
        return KeybindingsRegistry.registerAll(bindings);
      }, []);

      return React.createElement(OS.Zone, zoneProps as any, children);
    };
    ZoneComponent.displayName = `${appId}.${widgetName}.Zone`;

    // ── Build Item component ──
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
    ItemComponent.displayName = `${appId}.${widgetName}.Item`;

    // ── Build Field component ──
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
        if (config.field.onCancel)
          fieldProps["onCancel"] = config.field.onCancel;
      }

      return React.createElement(OS.Field, fieldProps as any);
    };
    FieldComponent.displayName = `${appId}.${widgetName}.Field`;

    // ── Build Keybindings component ──
    // Registers app keybindings on mount, unregisters on unmount.
    // Zone includes this automatically. Use standalone for widgets without Zone.
    const KeybindingsComponent: React.FC<{ children?: ReactNode }> = ({
      children,
    }) => {
      React.useEffect(() => {
        if (!config.keybindings || config.keybindings.length === 0) return;
        const bindings = config.keybindings.map((kb) => ({
          key: kb.key,
          command: kb.command,
          args: [{ id: "OS.FOCUS" }],
          when: kb.when ?? ("navigating" as const),
        }));
        return KeybindingsRegistry.registerAll(bindings);
      }, []);
      return React.createElement(React.Fragment, null, children);
    };
    KeybindingsComponent.displayName = `${appId}.${widgetName}.Keybindings`;

    return {
      Zone: ZoneComponent,
      Item: ItemComponent,
      Field: FieldComponent,
      Keybindings: KeybindingsComponent,
      commands: config.commands,
    };
  }

  // ── createTrigger ──
  // Overload 1: Simple trigger (wraps OS.Trigger with a command)
  function createTrigger<P>(
    command: CommandFactory<string, P>,
  ): React.FC<{ payload?: P; children: ReactNode }>;

  // Overload 2: Compound trigger (Dialog pattern with Trigger/Portal/Content/Dismiss)
  function createTrigger<P>(config: {
    id?: string;
    confirm?: CommandFactory<string, P>;
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

  // Implementation
  function createTrigger(commandOrConfig: any): any {
    // ── Simple trigger ──
    if (typeof commandOrConfig === "function") {
      const command = commandOrConfig as CommandFactory<string, any>;
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

    // ── Compound trigger (Dialog pattern) ──
    const config = commandOrConfig as {
      id?: string;
      confirm?: CommandFactory<string, any>;
    };

    const dialogId = config.id ?? `${appId}-dialog-${Date.now()}`;

    // Dialog.Root wrapper
    const RootComponent: React.FC<{ children: ReactNode }> = ({ children }) => {
      return React.createElement(OS.Dialog as any, { id: dialogId }, children);
    };
    RootComponent.displayName = `${appId}.Dialog`;

    // Dialog.Trigger
    const TriggerComponent: React.FC<{
      children: ReactNode;
      className?: string;
      asChild?: boolean;
    }> = ({ children, className, asChild }) => {
      return React.createElement(
        (OS.Dialog as any).Trigger,
        { className, asChild },
        children,
      );
    };
    TriggerComponent.displayName = `${appId}.Dialog.Trigger`;

    // Dialog.Content (marker — transformed by Dialog.Root)
    const ContentComponent: React.FC<{
      children: ReactNode;
      title?: string;
      className?: string;
      zoneClassName?: string;
    }> = (props) => {
      return React.createElement((OS.Dialog as any).Content, props as any);
    };
    ContentComponent.displayName = `${appId}.Dialog.Content`;

    // Dialog.Portal (direct Trigger.Portal usage)
    const PortalComponent: React.FC<{
      children: ReactNode;
      title?: string;
      description?: string;
      className?: string;
      contentClassName?: string;
    }> = (props) => {
      return React.createElement((OS.Trigger as any).Portal, props as any);
    };
    PortalComponent.displayName = `${appId}.Dialog.Portal`;

    // Dialog.Dismiss (close overlay)
    const DismissComponent: React.FC<{
      children: ReactNode;
      className?: string;
    }> = ({ children, className }) => {
      return React.createElement(
        (OS.Dialog as any).Close,
        { className },
        children,
      );
    };
    DismissComponent.displayName = `${appId}.Dialog.Dismiss`;

    // Dialog.Confirm (dismiss + dispatch confirm command)
    const ConfirmComponent: React.FC<{
      children: ReactNode;
      className?: string;
    }> = ({ children, className }) => {
      const confirmCmd = config.confirm ? config.confirm({} as any) : undefined;
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
  }

  // ── App-level API ──
  return {
    createWidget,
    createTrigger,

    /** Production: useComputed hook via singleton kernel */
    useComputed<T>(selector: (s: S) => T): T {
      return slice.useComputed(selector);
    },

    /** Production: read current state */
    getState(): S {
      return slice.getState();
    },

    /** Production: update state directly (for callback-based handlers like onCommit) */
    setState(updater: (prev: S) => S) {
      slice.setState(updater);
    },

    /** All registered commands across all widgets */
    get commands() {
      return allCommands;
    },

    /** Create isolated test instance with all widgets' commands */
    create(overrides?: Partial<S>): AppInstance<S, typeof allCommands, Sel> {
      const testState = overrides
        ? { ...initialState, ...overrides }
        : initialState;

      interface TestAppState {
        os: Record<string, never>;
        apps: Record<string, unknown>;
      }

      const testKernel = createKernel<TestAppState>({
        os: {},
        apps: { [appId]: testState },
      });

      const scope = defineScope(appId);
      const group = testKernel.group({
        scope,
        stateSlice: {
          get: (full: TestAppState) => full.apps[appId] as S,
          set: (full: TestAppState, s: unknown) => ({
            ...full,
            apps: { ...full.apps, [appId]: s },
          }),
        },
      });

      // Re-run all widget factories against test kernel
      const testDefine: WidgetDefine<S> = {
        command(type: string, ...args: any[]) {
          let deps: any[];
          let handler: any;
          let options: CommandOptions<S> | undefined;

          if (args.length >= 2 && Array.isArray(args[0])) {
            deps = args[0];
            handler = args[1];
            options = args[2];
          } else {
            deps = [];
            handler = args[0];
            options = args[1];
          }

          const factory = group.defineCommand(type, deps, handler as any);
          (factory as any).when = options?.when ?? null;
          return factory as any;
        },
      };

      const testCommands: Record<string, CommandFactory<any, any>> = {};
      for (const { factory } of allWidgetFactories) {
        const cfg = factory(testDefine);
        for (const [name, cmd] of Object.entries(cfg.commands)) {
          testCommands[name] = cmd as CommandFactory<any, any>;
        }
      }

      // Build dispatch proxy
      const dispatch: Record<string, (payload?: any) => void> = {};
      for (const [name, cmdFactory] of Object.entries(testCommands)) {
        dispatch[name] = (payload?: any) => {
          testKernel.dispatch((cmdFactory as any)(payload ?? {}));
        };
      }

      // Build select proxy
      const select: Record<string, (...args: any[]) => any> = {};
      if (options?.selectors) {
        for (const [name, selectorFn] of Object.entries(options.selectors)) {
          select[name] = (...args: any[]) => {
            const appState = testKernel.getState().apps[appId] as S;
            return selectorFn(appState, ...args);
          };
        }
      }

      return {
        get state() {
          return testKernel.getState().apps[appId] as S;
        },
        dispatch: dispatch as any,
        select: select as any,
        commands: testCommands as any,
        reset() {
          testKernel.setState(() => ({
            os: {},
            apps: { [appId]: testState },
          }));
        },
      };
    },
  };
}
