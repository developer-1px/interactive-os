import type { CommandDefinition } from "@os/core/command/definition";
import type { KeymapConfig } from "@os/core/input/keybinding";
import type { PersistenceAdapter } from "@os/core/persistence/adapter";
import type { ContextState } from "@os/core/logic/types";

export interface AppModelConfig<S> {
    initial: S;
    persistence?: {
        key: string;
        version?: number;
        adapter?: PersistenceAdapter;
        debounceMs?: number;
    };
}

export type Middleware<S> = (state: S, action: any, prevState: S) => S;

export interface AppDefinition<S, C extends string = string> {
    id: string; // Unique App ID (e.g. "todo")
    name: string;

    model: AppModelConfig<S>;

    commands?: CommandDefinition<S, any, any>[]; // Optional with Zero-Config Discovery
    keymap: KeymapConfig<C>;

    middleware?: Middleware<S>[];

    // Maps AppState to OS Context (for 'when' clauses)
    contextMap?: (state: S, env: { activeZoneId: string | null; focusPath: string[]; focusedItemId: string | null }) => Partial<ContextState>;
}

export function defineApplication<S, C extends string>(config: AppDefinition<S, C>): AppDefinition<S, C> {
    return config;
}
