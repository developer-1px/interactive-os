import type { CommandDefinition } from "@os/entities/CommandDefinition";
import type { KeybindingItem } from "@os/entities/KeybindingItem";
import type { KeymapConfig } from "@os/features/keyboard/lib/getCanonicalKey";

export interface AppDefinition<S, K extends string = string> {
  id: string;
  name?: string;
  commands?: CommandDefinition<S, any, K>[];
  keymap: KeybindingItem<any>[] | KeymapConfig<any>;
  model: {
    initial: S;
    persistence?: {
      key: string;
      adapter?: any;
      debounceMs?: number;
    };
  };
  middleware?: ((state: S, action: any, prev: S) => S)[];
  contextMap?: (state: S, env: any) => any;
}

export function defineApplication<S, K extends string = string>(
  config: AppDefinition<S, K>,
): AppDefinition<S, K> {
  return config;
}
