import type { LogicNode } from "@os/core/logic/types";
import { ZoneRegistry } from "./zoneRegistry";

export interface CommandDefinition<S, P, K extends string = string> {
  id: K;
  run: (state: S, payload: P) => S;
  when?: string | LogicNode;
  log?: boolean;
}

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
  zoneId?: string;
}

/**
 * createCommandFactory:
 * Creates a strongly typed `defineCommand` helper for a specific State type.
 */
// Zone-Aware Command Factory
export function createCommandFactory<S, Z extends string = string>(zoneId?: Z) {
  return function defineCommand<P, K extends string = string>(
    def: CommandDefinition<S, P, K>
  ): CommandFactory<S, P, K> {
    const factory = ((payload: P) => {
      const action = {
        type: def.id,
        payload,
      };
      // Zero-Config Discovery: Embed definition for JIT registration
      Object.defineProperty(action, "_def", {
        value: def,
        enumerable: false, // Hidden from iteration/serialization
        writable: false,
      });
      return action;
    }) as CommandFactory<S, P, K>;

    // Attach properties
    factory.id = def.id;
    factory.run = def.run;
    factory.when = def.when;
    factory.log = def.log;

    // Zone Awareness
    factory.zoneId = zoneId;

    // Auto-Register to Zone Registry (Discovery)
    if (zoneId) {
      ZoneRegistry.register(zoneId, factory);
    }

    return factory;
  };
}
