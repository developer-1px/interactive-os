/**
 * createEngine - Command Engine Factory
 * Creates a CommandRegistry and Store from an AppDefinition.
 */

import type { AppDefinition } from "@os/features/application/defineApplication";
import { createCommandStore, CommandRegistry } from "@os/features/command/model/createCommandStore";
import { ALL_OS_COMMANDS } from "@os/features/command/definitions/osCommands";
import { resolveFocusMiddleware } from "@os/features/command/middleware/resolveFocusMiddleware";

export function createEngine<S>(definition: AppDefinition<S>) {
    const registry = new CommandRegistry<S>();
    definition.commands?.forEach((cmd) => registry.register(cmd));
    ALL_OS_COMMANDS.forEach((cmd) => registry.register(cmd));
    registry.setKeymap(definition.keymap);

    const store = createCommandStore(registry, definition.model.initial, {
        persistence: definition.model.persistence,
        // OS-level middleware for all apps
        middleware: [resolveFocusMiddleware],
        onStateChange: (state: S, action: any, prev: S) => {
            return definition.middleware?.reduce((s, mw) => mw(s, action, prev), state) ?? state;
        }
    });

    return { registry, store };
}

