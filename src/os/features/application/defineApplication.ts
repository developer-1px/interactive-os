import type { CommandDefinition } from "@os/entities/CommandDefinition";
import type { KeymapConfig } from "@/os-new/1-sensor/keyboard/getCanonicalKey.ts";
import type { KeybindingItem } from "@/os-new/schema/keyboard/KeybindingItem";

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
  middleware?: import("@os/features/command/model/createCommandStore").Middleware<
    S,
    any
  >[];
  contextMap?: (state: S, env: any) => any;
}

export function defineApplication<S, K extends string = string>(
  config: AppDefinition<S, K>,
): AppDefinition<S, K> {
  return config;
}
