import type { LogicNode } from "./logic/builder";

export interface CommandDefinition<S, P, K extends string = string, E = any> {
  id: K;
  run: (state: S, payload: P, env: E) => S;
  label?: string;
  icon?: string;
  when?: string | LogicNode;
  log?: boolean;
  enabled?: (state: S) => boolean;
  injectFocus?: boolean;
}

export interface CommandFactory<S, P, K extends string = string, E = any> {
  /**
   * The Factory Call: Creates the command object.
   */
  (payload: P): { type: K; payload: P };

  /**
   * The Definition Properties: Used by the Registry/Engine.
   */
  id: K;
  run: (state: S, payload: P, env: E) => S;
  label?: string;
  icon?: string;
  when?: string | LogicNode;
  log?: boolean;
  enabled?: (state: S) => boolean;
  injectFocus?: boolean;
}

/**
 * createCommandFactory:
 * Creates a strongly typed `defineCommand` helper for a specific State type.
 */
export function createCommandFactory<S, E = any>() {
  return function defineCommand<P, K extends string = string>(
    def: CommandDefinition<S, P, K, E>,
  ): CommandFactory<S, P, K, E> {
    const factory = ((payload: P) => ({
      type: def.id,
      payload,
    })) as CommandFactory<S, P, K, E>;

    // Attach properties
    factory.id = def.id;
    factory.run = def.run;
    factory.label = def.label;
    factory.icon = def.icon;
    factory.when = def.when;
    factory.log = def.log;
    factory.enabled = def.enabled;
    factory.injectFocus = def.injectFocus;

    return factory;
  };
}
