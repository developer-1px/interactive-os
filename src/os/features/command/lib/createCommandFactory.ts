import type { CommandDefinition } from "@os/entities/CommandDefinition";
import type { CommandFactory } from "@os/entities/CommandFactory";
import { GroupRegistry } from "../../jurisdiction/model/GroupRegistry";

/**
 * createCommandFactory:
 * Creates a strongly typed `defineCommand` helper for a specific State type.
 */
// Group-Aware Command Factory
export function createCommandFactory<S, G extends string = string>(
  groupId?: G,
) {
  return function defineCommand<P, K extends string = string>(
    def: CommandDefinition<S, P, K>,
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
    if (def.when !== undefined) factory.when = def.when;
    if (def.log !== undefined) factory.log = def.log;

    // Group Awareness
    if (groupId !== undefined) factory.groupId = groupId;

    // Auto-Register to Group Registry (Discovery)
    if (groupId) {
      GroupRegistry.register(groupId, factory);
    }

    return factory;
  };
}
