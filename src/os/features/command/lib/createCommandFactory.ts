import { ZoneRegistry } from "../../jurisdiction/model/ZoneRegistry";
import type { CommandDefinition } from "@os/entities/CommandDefinition";
import type { CommandFactory } from "@os/entities/CommandFactory";

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
