import { create } from "zustand";

import type { KeybindingItem, KeymapConfig } from "@os/core/input/keybinding";
import type { CommandDefinition } from "@os/core/command/definition";

import type { PersistenceAdapter } from "@os/core/persistence/adapter";
import { LocalStorageAdapter } from "@os/core/persistence/adapter";

import { logger } from "@os/debug/logger";

export interface CommandGroup<S, P = any, K extends string = string> {
  id: string;
  when?: string;
  commands: CommandDefinition<S, P, K>[];
}


import { OS } from "@os/core/context";
import { useFocusStore } from "@os/core/focus/focusStore";


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
   * Auto-Registers commands found in the keymap that are Command Objects.
   */
  setKeymap(keymap: KeybindingItem<any>[] | KeymapConfig<any>) {
    this.keymap = keymap;

    // Zero-Config Discovery: Collect all bindings
    const allBindings: KeybindingItem<any>[] = [];
    if (Array.isArray(keymap)) {
      allBindings.push(...keymap);
    } else {
      if (keymap.global) allBindings.push(...keymap.global);
      if (keymap.zones) {
        Object.values(keymap.zones).forEach(arr => allBindings.push(...arr));
      }
    }

    // Scan for Object Commands
    let autoRegistered = 0;
    allBindings.forEach(binding => {
      const cmd = binding.command;
      // Duck Type Check: Is it a CommandFactory?
      if (
        cmd &&
        typeof cmd === 'function' &&
        'id' in cmd &&
        'run' in cmd
      ) {
        // It IS a command factory.
        const definition = cmd as unknown as CommandDefinition<S, any, K>;

        // Check if already registered
        if (!this.commands.has(definition.id)) {
          this.register(definition);
          autoRegistered++;
        }
      }
    });

    // Count entries for logging
    const count = allBindings.length;
    logger.debug("SYSTEM", `Loaded External Keymap: ${count} entries (${autoRegistered} auto-discovered)`);
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
              return {
                ...b,
                zoneId, // Tag the binding with its zone of origin
              };
            },
          );
          rawBindings.push(...scopedBindings);
        });
      }
    }

    return rawBindings.map((binding) => {
      // Logic Update: Support Object References in Keybinding
      // binding.command can be "ADD_TODO" (string) OR CommandFactory object
      const commandId = typeof binding.command === 'function' && 'id' in binding.command
        ? (binding.command as any).id
        : (typeof binding.command === 'object' && 'id' in (binding.command as any))
          ? (binding.command as any).id
          : binding.command;

      const cmd = this.get(commandId as K);
      if (!cmd) return binding;

      // Merging logic (as discussed)
      // If binding has 'when', use it (it now includes zone scope).
      // Default to command.when ONLY if binding.when is missing (e.g. global).
      return {
        ...binding,
        command: commandId, // Normalize to string ID for internal consumption
        when: binding.when || cmd.when,
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
    persistence?: {
      key: string;
      adapter?: PersistenceAdapter;
      debounceMs?: number;
    };
  },
) {
  // 1. Auto-Hydrate
  let startState = initialState;
  if (config?.persistence) {
    const { key, adapter = LocalStorageAdapter } = config.persistence;
    const loaded = adapter.load(key);
    if (loaded && typeof loaded === "object" && !Array.isArray(loaded)) {
      // Smarter Merge: 
      // We want to preserve the root structure of initialState while overlaying loaded data.
      // Especially important if AppState structure changed (e.g. data moved or keys added).
      startState = {
        ...initialState,
        ...loaded,
        // Deep merge data/ui if they exist to avoid wiping out default keys in newer app versions
        data: (initialState as any).data && (loaded as any).data
          ? { ...(initialState as any).data, ...(loaded as any).data }
          : (loaded as any).data || (initialState as any).data,
        ui: (initialState as any).ui && (loaded as any).ui
          ? { ...(initialState as any).ui, ...(loaded as any).ui }
          : (loaded as any).ui || (initialState as any).ui,
      };

      logger.debug("ENGINE", `◈ Hydrated state from [${key}]`, {
        keys: Object.keys(loaded),
        hasData: !!(loaded as any).data
      });
    }
  }

  // Debounce Timer
  let saveTimeout: any;

  return create<CommandStoreState<S, A>>((set) => ({
    state: startState,
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

        // Persistence Hook
        if (config?.persistence) {
          const { key, adapter = LocalStorageAdapter, debounceMs = 300 } = config.persistence;
          clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
            // Persist the FULL state.
            // If Apps want partial, they should split state or we add 'selector' to config later.
            // For Todo App compatibility (it saved `state.data`), we might have an issue.
            // User's Todo App previously saved `state.data`.
            // Now we save `state`.
            // The `persistence.ts` loader logic was `loadedState = { ...INITIAL_STATE, data: ... }` assuming full state structure or data-only structure?
            // `loadState` in `persistence.ts` did: `const parsed = JSON.parse(stored); ... loadedState = { ...INITIAL, data: { ...parsed?? No } }`.
            // Wait, previous `loadState` logic:
            // `if (!Array.isArray(parsed.todos) && parsed.categories) { loadedState = { ...INITIAL, data: { ...parsed } } }`
            // It assumed the stored object WAS the data object structure (categories, todos).
            // So `state.data` was stored.
            // If I now store `state` (which has `data`, `ui`, `effects`...), the structure changes.
            // Breaking Change? Yes. 
            // Better to default to storing EVERYTHING, and update `Todo` to handle it?
            // Or add a `selector` to config?
            // Let's store `state.data` by default? No, that assumes `state` has `data`.
            // Standard approach: Store everything.
            // I will implement "Store Everything".
            // If this breaks Todo's hydration (which expects data-only structure in localStorage), I will wipe the storage key or update key name.
            // I'll change the key to "interactive-os-todo-v4" to avoid conflicts.
            adapter.save(key, finalState);
          }, debounceMs);
        }

        return { state: finalState };
      }),
  }));
}

// useCommandCenter moved to ./hooks/useCommandCenter.ts
