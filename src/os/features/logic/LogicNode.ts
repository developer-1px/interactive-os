export type ContextKey = string;
export type ContextValue =
  | boolean
  | string
  | number
  | null
  | undefined
  | string[];
export interface ContextState {
  activeZone?: string;
  focusPath?: string[]; // Hierarchical Zone Stack
  [key: ContextKey]: ContextValue;
}

/**
 * LogicNode is now a pure function that carries its own string representation.
 */
export type LogicNode = {
  (ctx: ContextState): boolean;
  toString(): string;
};

// For backward compatibility during migration
export type LogicEvaluator = LogicNode;
