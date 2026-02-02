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
    // 1. Try Custom Strategy
    const strategy = this.strategies[zoneId];
    if (strategy) {
      const result = strategy(state, ctx);
      if (result) return result;
    }

    // 2. Fallback: Generic Engine Strategy (Data-Driven)
    return this.defaultStrategy(zoneId);
  }

  private defaultStrategy(zoneId: string): string | null {
    // Lazy import or direct access to store state to avoid circular dependency issues if possible
    // Assuming useFocusStore is available globally or imported
    // We can't easily import hook here if it's strictly logic, but extracting state is fine.

    // We need to access the ZoneRegistry "DB"
    const registry = require("../stores/useFocusStore").useFocusStore.getState().zoneRegistry;
    const zone = registry[zoneId];
    if (!zone) return null;

    // A. Priority: items[0] (Smart Resume could be here later)
    if (zone.items && zone.items.length > 0) {
      return zone.items[0];
    }

    // B. Fallback: defaultFocusId
    if (zone.defaultFocusId) {
      return zone.defaultFocusId;
    }

    return null;
  }
}

export const focusRegistry = new FocusStrategyRegistry();
