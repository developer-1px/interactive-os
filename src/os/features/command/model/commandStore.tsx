import { create } from "zustand";

import { logger } from "@os/app/debug/logger";
import { useCommandEventBus } from "@os/features/command/lib/commandEventBus";

// Modules
import { CommandRegistry, type CommandGroup } from "@os/features/command/model/CommandRegistry";
// Middleware is now injected via config!
import { hydrateState, createPersister, type PersistenceConfig } from "@os/features/persistence/storePersistence";

// Re-exports for consumers
export { CommandRegistry, type CommandGroup };

export interface CommandStoreState<S, A> {
  state: S;
  dispatch: (action: A) => void;
}

export type Middleware<A> = (action: A) => A;

export function createCommandStore<S, A extends { type: string; payload?: any }>(
  registry: CommandRegistry<S, any>,
  initialState: S,
  config?: {
    onStateChange?: (state: S, action: A, prevState: S) => S;
    onDispatch?: (action: A) => A; // Legacy single interceptor
    middleware?: Middleware<A>[];  // New Middleware Chain
    persistence?: PersistenceConfig;
  },
) {
  // 1. Initial Hydration
  const startState = hydrateState(initialState, config?.persistence);
  const persist = createPersister<S>(config?.persistence);

  return create<CommandStoreState<S, A>>((set) => ({
    state: startState,
    dispatch: (startAction) =>
      set((prev) => {
        let action = startAction;

        // 1. Legacy Interceptor
        if (config?.onDispatch) {
          action = config.onDispatch(action);
        }

        // 2. Middleware Chain
        if (config?.middleware) {
          for (const mw of config.middleware) {
            action = mw(action);
          }
        }

        // 3. Emit Event
        useCommandEventBus.getState().emit(action as any);

        // 4. Command Lookup
        const cmd = registry.get(action.type);
        if (!cmd) {
          logger.warn("ENGINE", `Unknown command: ${action.type}`);
          return prev;
        }

        // 5. Execution
        const nextState = cmd.run(prev.state, action.payload);
        const finalState = config?.onStateChange
          ? config.onStateChange(nextState, action, prev.state)
          : nextState;

        // 6. Logging
        if (cmd.log !== false) {
          logger.traceCommand(action.type, action.payload, prev.state, finalState);
        }

        // 7. Persistence (Side Effect)
        persist(finalState);

        return { state: finalState };
      }),
  }));
}
