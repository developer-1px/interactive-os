import { create } from "zustand";

import type { KeybindingItem, KeymapConfig } from "@os/core/input/keybinding";
import type { CommandDefinition } from "@os/core/command/definition";

import { logger } from "@os/debug/logger";

export interface CommandGroup<S, P = any, K extends string = string> {
  id: string;
  when?: string;
  commands: CommandDefinition<S, P, K>[];
}



export class CommandRegistry<S, K extends string = string, E = any> {
  private commands: Map<K, CommandDefinition<S, any, K, E>> = new Map();
  private keymap: KeybindingItem<any>[] | KeymapConfig<any> = [];

  register(definition: CommandDefinition<S, any, K, E>) {
    this.commands.set(definition.id, definition);
    logger.debug("SYSTEM", `Registered Command: [${definition.id}]`);
  }

  registerGroup(group: CommandGroup<S, any, K>) {
    group.commands.forEach((cmd) => {
      const combinedWhen = group.when
        ? cmd.when
          ? `(${group.when}) && (${cmd.when})`
          : group.when
        : cmd.when;

      this.register({
        ...cmd,
        when: combinedWhen,
      });
    });
    logger.debug(
      "SYSTEM",
      `Registered Group: [${group.id}] with ${group.commands.length} commands`,
    );
  }

  /**
   * Set external key mapping (KeybindingItem[] or KeymapConfig)
   */
  setKeymap(keymap: KeybindingItem<any>[] | KeymapConfig<any>) {
    this.keymap = keymap;
    // Count entries for logging
    const count = Array.isArray(keymap)
      ? keymap.length
      : (keymap.global?.length || 0) +
      Object.values(keymap.zones || {}).reduce(
        (acc: number, arr: any) => acc + arr.length,
        0,
      );
    logger.debug("SYSTEM", `Loaded External Keymap: ${count} entries`);
  }

  get(id: K): CommandDefinition<S, any, K, E> | undefined {
    return this.commands.get(id);
  }

  getAll(): CommandDefinition<S, any, K>[] {
    return Array.from(this.commands.values());
  }

  getKeybindings(): KeybindingItem<any>[] {
    let rawBindings: KeybindingItem<any>[] = [];

    // Normalize Input: Flatten if it's a Config Tree
    if (Array.isArray(this.keymap)) {
      rawBindings = this.keymap;
    } else {
      // Flatten Logic
      // 1. Global
      if (this.keymap.global) {
        rawBindings.push(...this.keymap.global);
      }
      // 2. Zones (Apply Scope Logic)
      if (this.keymap.zones) {
        Object.entries(this.keymap.zones).forEach(([zoneId, bindings]) => {
          const scopedBindings = (bindings as KeybindingItem<any>[]).map(
            (b) => {
              // Scope Condition: activeZone == zoneId
              const scopeStr = `activeZone == '${zoneId}'`;
              const scopeNode = {
                op: "eq",
                key: "activeZone",
                val: zoneId,
                description: `activeZone == '${zoneId}'`,
              };

              let newWhen: any;

              if (!b.when) {
                newWhen = scopeNode;
              } else if (typeof b.when === "string") {
                newWhen = `(${b.when}) && ${scopeStr}`;
              } else {
                // Assume LogicNode
                newWhen = {
                  op: "and",
                  left: b.when,
                  right: scopeNode,
                  description: `(${b.when.description || "Custom"} AND ${scopeNode.description})`,
                };
              }

              return {
                ...b,
                when: newWhen,
              };
            },
          );
          rawBindings.push(...scopedBindings);
        });
      }
    }

    return rawBindings.map((binding) => {
      const cmd = this.get(binding.command as K);
      if (!cmd) return binding;

      // Merging logic (as discussed)
      // If binding has 'when', use it (it now includes zone scope).
      // Default to command.when ONLY if binding.when is missing (e.g. global).
      return {
        ...binding,
        when: binding.when || cmd.when,
        // Removed cmd.args fallback (deprecated)
        args: binding.args,
        allowInInput: binding.allowInInput, // Strict Separation: Binding owns the context!
      };
    });
  }
}

export interface CommandStoreState<S, A> {
  state: S;
  dispatch: (action: A) => void;
}

/**
 * createCommandStore:
 * Creates a global Zustand store for a given registry and initial state.
 */
export function createCommandStore<
  S,
  A extends { type: string; payload?: any },
  E = any,
>(
  registry: CommandRegistry<S, any, E>,
  initialState: S,
  config?: {
    onStateChange?: (state: S, action: A, prevState: S) => S;
    onDispatch?: (action: A) => A; // Interceptor
    getEnv?: () => E; // Environment Getter
  },
) {
  return create<CommandStoreState<S, A>>((set) => ({
    state: initialState,
    dispatch: (startAction) =>
      set((prev) => {
        // Run interceptor if defined
        const action = config?.onDispatch
          ? config.onDispatch(startAction)
          : startAction;

        const cmd = registry.get(action.type);
        if (!cmd) {
          logger.warn(
            "ENGINE",
            `No command registered for type: ${action.type}`,
          );
          return prev;
        }

        // Inject Environment (Context Receiver Pattern)
        const env = config?.getEnv ? config.getEnv() : ({} as E);

        const nextInnerState = cmd.run(prev.state, action.payload, env);
        const finalState = config?.onStateChange
          ? config.onStateChange(nextInnerState, action, prev.state)
          : nextInnerState;

        if (cmd.log !== false) {
          logger.traceCommand(
            action.type,
            action.payload,
            prev.state,
            finalState,
          );
        }

        return { state: finalState };
      }),
  }));
}

// useCommandCenter moved to ./hooks/useCommandCenter.ts
