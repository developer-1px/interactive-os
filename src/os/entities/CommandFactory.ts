import type { LogicNode } from "@os/features/logic/LogicNode";

// Moved from src/os/core/command/definition.ts
export interface CommandFactory<S, P, K extends string = string> {
  /**
   * The Factory Call: Creates the command object.
   */
  (payload: P): { type: K; payload: P };

  /**
   * The Definition Properties: Used by the Registry/Engine.
   */
  id: K;
  run: (state: S, payload: P) => S;
  when?: string | LogicNode;
  log?: boolean;
  groupId?: string;
}
