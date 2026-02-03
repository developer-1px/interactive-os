import { create } from "zustand";

import type { KeybindingItem, KeymapConfig } from "@os/core/input/keybinding";
import type { CommandDefinition } from "@os/core/command/definition";
import { Rule } from "@os/core/logic/builder";
import type { ContextState, LogicNode } from "@os/core/logic/types";

import { logger } from "@os/debug/logger";

export interface CommandGroup<S, P = any, K extends string = string> {
  id: string;
  when?: string;
  commands: CommandDefinition<S, P, K>[];
}


import { OS } from "@os/core/context";
import { useFocusStore } from "@os/core/focus";


export class CommandRegistry<S, K extends string = string> {
  private commands: Map<K, CommandDefinition<S, any, K>> = new Map();
  private keymap: KeybindingItem<any>[] | KeymapConfig<any> = [];

  register(definition: CommandDefinition<S, any, K>) {
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

  get(id: K): CommandDefinition<S, any, K> | undefined {
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
              // Scope Condition: activeZone == zoneId OR area == zoneId
              const scopeStr = `(activeZone == '${zoneId}' || area == '${zoneId}')`;
              const scopeEvaluator = (ctx: ContextState) =>
                ctx.activeZone === zoneId || ctx.area === zoneId;

              let newWhen: string | LogicNode;

              if (!b.when) {
                newWhen = scopeEvaluator;
              } else if (typeof b.when === "string") {
                newWhen = `(${b.when}) && ${scopeStr}`;
              } else {
                newWhen = Rule.and(b.when, scopeEvaluator);
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
>(
  registry: CommandRegistry<S, any>,
  initialState: S,
  config?: {
    onStateChange?: (state: S, action: A, prevState: S) => S;
    onDispatch?: (action: A) => A; // Interceptor
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

        // Middleware Resolution: Resolve OS.FOCUS sentinel
        // We do a shallow check for OS.FOCUS in the payload
        let resolvedPayload = action.payload;
        if (resolvedPayload && typeof resolvedPayload === "object") {
          // Check if any value is OS.FOCUS
          const hasSentinel = Object.values(resolvedPayload).includes(OS.FOCUS);

          if (hasSentinel) {
            const focusId = useFocusStore.getState().focusedItemId;
            if (focusId) {
              // Resolve
              resolvedPayload = { ...resolvedPayload }; // Shallow clone
              Object.keys(resolvedPayload).forEach((key) => {
                if (resolvedPayload[key] === OS.FOCUS) {
                  // Resolve to number if possible, else string
                  // Assuming ID is usually number in Todo App context, but stringent typing might be needed
                  // For now, we cast to Number if it looks like one, or keep as string.
                  // BUT: focusedItemId is string. The App expects number often.
                  // We should trust the App to handle string-number conversion or provide explicit type?
                  // Let's resolve to explicit ID (string) and hope App handles it (or we cast here).
                  // Antigravity Standard: IDs are strings in OS, but mapped to numbers in Todo?
                  // TodoEngine uses number IDs.
                  // Let's safe-cast to Number if not NaN, else string.
                  const num = Number(focusId);
                  resolvedPayload[key] = !isNaN(num) ? num : focusId;
                }
              });
              logger.debug("ENGINE", `Resolved Payload via OS.FOCUS ->`, resolvedPayload);
            } else {
              logger.warn("ENGINE", "OS.FOCUS sentinel found but no active focus!");
            }
          }
        }

        const resolvedAction = { ...action, payload: resolvedPayload };

        const nextInnerState = cmd.run(prev.state, resolvedPayload);
        const finalState = config?.onStateChange
          ? config.onStateChange(nextInnerState, resolvedAction, prev.state)
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
