import { logger } from "@/os-new/lib/logger";
import { useCommandEventBus } from "@os/features/command/lib/useCommandEventBus";
// Modules
import {
  type CommandGroup,
  CommandRegistry,
} from "@os/features/command/model/CommandRegistry";
import { FocusData } from "@os/features/focus/lib/focusData";
import {
  consumeInputInfo,
  consumeCollectedEffects,
} from "@os/features/focus/pipeline/core/osCommand";
import { TransactionLog } from "@os/inspector/InspectorLogStore";
import { computeDiff } from "@os/schema";
import { buildCurrentSnapshot } from "@os/features/focus/schema/analyzer";
import { GroupRegistry } from "@os/features/jurisdiction/model/GroupRegistry";
// Middleware is now injected via config!
import {
  createPersister,
  hydrateState,
  type PersistenceConfig,
} from "@os/features/persistence/hydrateState";
import { dispatchGuard } from "@/os-new/lib/loopGuard";
import { create } from "zustand";

// Re-exports for consumers
export { CommandRegistry, type CommandGroup };

export interface CommandStoreState<S, A> {
  state: S;
  dispatch: (action: A) => void;
}

// Redux-style middleware with next pattern
export type Next<S, A> = (state: S, action: A) => S;
export type Middleware<S, A> = (next: Next<S, A>) => Next<S, A>;

export function createCommandStore<
  S,
  A extends { type: string; payload?: any },
>(
  registry: CommandRegistry<S, any>,
  initialState: S,
  config?: {
    middleware?: Middleware<S, A>[];
    persistence?: PersistenceConfig;
  },
) {
  // 1. Initial Hydration
  const startState = hydrateState(initialState, config?.persistence);
  const persist = createPersister<S>(config?.persistence);

  return create<CommandStoreState<S, A>>((set) => ({
    state: startState,
    dispatch: (action) =>
      set((prev) => {
        // ── Loop Guard: prevent recursive dispatch ──
        if (!dispatchGuard.enter()) return prev;
        try {
          // ── Transaction Boundary ──
          // ① Capture input info + before snapshot
          const inputInfo = consumeInputInfo();
          const beforeSnapshot = buildCurrentSnapshot();

          // ── Core Dispatch: Registry Lookup + Command Execution ──
          const coreDispatch: Next<S, A> = (state, act) => {
            // ① Emit to event bus (OS handlers like FocusIntent → runOS)
            useCommandEventBus.getState().emit(act as any);

            // 2. Hierarchical Command Lookup
            let cmd = registry.get(act.type);

            // If not in global flat registry, try hierarchical resolution
            if (!cmd) {
              const focusPath = FocusData.getFocusPath();
              const bubblePath = [...focusPath].reverse();

              for (const groupId of bubblePath) {
                const zoneCmd = GroupRegistry.get(groupId, act.type);
                if (zoneCmd) {
                  cmd = zoneCmd as any;
                  break;
                }
              }
            }

            if (!cmd) {
              logger.warn("ENGINE", `Unknown command: ${act.type}`);
              return state;
            }

            // 3. Execute command
            const nextState = cmd.run(state, act.payload);

            // 4. Logging
            if (cmd.log !== false) {
              logger.traceCommand(act.type, act.payload, state, nextState);
            }

            return nextState;
          };

          // ── Middleware Pipeline Composition ──
          const pipeline = (config?.middleware || []).reduceRight(
            (next, mw) => mw(next),
            coreDispatch,
          );

          // ── Execute Pipeline ──
          const finalState = pipeline(prev.state, action);

          // ── Transaction Commit ──
          // ② Capture after snapshot with collected effects
          const effects = consumeCollectedEffects();
          const afterSnapshot = buildCurrentSnapshot(effects);

          // ③ Compute diff + record transaction
          const diff = computeDiff(beforeSnapshot, afterSnapshot);

          TransactionLog.add({
            input: inputInfo,
            command: { type: action.type, payload: action.payload },
            snapshot: afterSnapshot,
            diff,
          });

          // ── Persistence (Side Effect) ──
          persist(finalState);

          return { state: finalState };
        } finally {
          dispatchGuard.exit();
        }
      }),
  }));
}
