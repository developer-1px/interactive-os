/**
 * createEngine - Command Engine Factory
 * Creates a CommandRegistry and Store from an AppDefinition.
 *
 * OS built-in middleware are auto-applied in order:
 * 1. resolveFocusMiddleware (PRE: OS.FOCUS resolution)
 * 2. navigationMiddleware (POST: effects → zone state)
 * 3. historyMiddleware (POST: undo/redo recording)
 * 4. App custom middleware (if any)
 */

import type { AppDefinition } from "@os/core/application/defineApplication";
import { ALL_OS_COMMANDS } from "@os/core/command/definitions/osCommands";
import {
  CommandRegistry,
  createCommandStore,
} from "@os/core/command/model/createCommandStore";

export function createEngine<S>(definition: AppDefinition<S>) {
  const registry = new CommandRegistry<S>();
  definition.commands?.forEach((cmd) => {
    registry.register(cmd);
  });
  ALL_OS_COMMANDS.forEach((cmd) => {
    registry.register(cmd);
  });
  registry.setKeymap(definition.keymap);

  const store = createCommandStore(registry, definition.model.initial, {
    ...(definition.model.persistence !== undefined
      ? { persistence: definition.model.persistence }
      : {}),
    middleware: [
      ...(definition.middleware || []), // App custom
    ],
  });

  return { registry, store };
}
