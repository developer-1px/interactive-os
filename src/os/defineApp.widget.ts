/**
 * defineApp — v3 Widget compatibility layer
 *
 * Adapts v3 widget pattern (curried handlers) → v5 createZone + bind.
 * Pure function — all defineApp internals injected via callbacks.
 */

import type { CommandFactory } from "@kernel/core/tokens";
import { Keybindings as KeybindingsRegistry } from "@os/keymaps/keybindings";
import React, { type ReactNode } from "react";
import type { Condition, FlatHandler, ZoneHandle } from "./defineApp.types";

// ═══════════════════════════════════════════════════════════════════
// Widget Config (injected by defineApp)
// ═══════════════════════════════════════════════════════════════════

export interface WidgetDeps<S> {
  createZone: (name: string) => ZoneHandle<S>;
  registerCommand: <T extends string, P = void>(
    type: T,
    handler: FlatHandler<S, P>,
    opts?: { when?: Condition<S> },
  ) => CommandFactory<T, P>;
  defineCondition: (
    name: string,
    predicate: (state: S) => boolean,
  ) => Condition<S>;
}

// ═══════════════════════════════════════════════════════════════════
// createWidget — Pure function
// ═══════════════════════════════════════════════════════════════════

export function createWidgetFactory<
  S,
  C extends Record<string, CommandFactory<any, any>>,
>(
  deps: WidgetDeps<S>,
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
  const zone = deps.createZone(widgetName);

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
        ? deps.defineCondition(
            `__v3_when_${type}`,
            cmdOptions.when as (state: S) => boolean,
          )
        : undefined;

      const cmdFactory = deps.registerCommand(type, flatHandler, {
        when: whenCondition,
      });

      // v3 compat: attach when metadata
      (cmdFactory as any).when = cmdOptions?.when ?? null;

      return cmdFactory as any;
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
}
