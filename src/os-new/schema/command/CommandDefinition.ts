import type { LogicNode } from "@/os-new/schema/logic/LogicNode";

// Moved from src/os/core/command/definition.ts
export interface CommandDefinition<S, P, K extends string = string> {
  id: K;
  run: (state: S, payload: P) => S;
  when?: string | LogicNode;
  log?: boolean;
}
