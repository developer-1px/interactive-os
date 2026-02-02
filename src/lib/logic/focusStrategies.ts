import type { TodoContext } from "./schema";
import type { AppState } from "../types";

/**
 * A Focus Strategy determines "What ID should be focused?"
 * when a Zone is activated.
 *
 * It receives the current application state/context and returns a Target ID.
 */
export type FocusStrategy = (
  state: AppState,
  ctx: TodoContext,
) => string | null;

class FocusStrategyRegistry {
  private strategies: Record<string, FocusStrategy> = {};

  register(zoneId: string, strategy: FocusStrategy) {
    this.strategies[zoneId] = strategy;
  }

  resolve(zoneId: string, state: AppState, ctx: TodoContext): string | null {
    const strategy = this.strategies[zoneId];
    if (!strategy) return null;
    return strategy(state, ctx);
  }
}

export const focusRegistry = new FocusStrategyRegistry();
