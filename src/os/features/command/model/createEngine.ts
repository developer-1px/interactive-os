/**
 * createEngine - Command Engine Factory
 * Creates a CommandRegistry and Store from an AppDefinition.
 *
 * OS built-in middleware (navigation, history) are auto-applied
 * before any app-specific middleware.
 */

import type { AppDefinition } from "@os/features/application/defineApplication";
import { ALL_OS_COMMANDS } from "@os/features/command/definitions/osCommands";
import { resolveFocusMiddleware } from "@os/features/command/middleware/resolveFocusMiddleware";
import {
  CommandRegistry,
  createCommandStore,
} from "@os/features/command/model/createCommandStore";
import {
  navigationMiddleware,
  historyMiddleware,
} from "@os/middleware";

export function createEngine<S>(definition: AppDefinition<S>) {
  const registry = new CommandRegistry<S>();
  definition.commands?.forEach((cmd) => registry.register(cmd));
  ALL_OS_COMMANDS.forEach((cmd) => registry.register(cmd));
  registry.setKeymap(definition.keymap);

  // OS built-in middleware chain (runs before app middleware)
  const osStateMiddleware = [navigationMiddleware, historyMiddleware];

  const store = createCommandStore(registry, definition.model.initial, {
    persistence: definition.model.persistence,
    // OS-level middleware for all apps
    middleware: [resolveFocusMiddleware],
    onStateChange: (state: S, action: any, prev: S) => {
      // 1. OS built-in middleware (navigation → history)
      let s = state;
      for (const mw of osStateMiddleware) {
        s = (mw as any)(s, action, prev);
      }
      // 2. App-specific middleware (custom)
      if (definition.middleware) {
        s = definition.middleware.reduce((acc, mw) => mw(acc, action, prev), s);
      }
      return s;
    },
  });

  return { registry, store };
}

