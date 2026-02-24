/**
 * history() — App Module for undo/redo history.
 *
 * Wraps the existing createHistoryMiddleware as an AppModule.
 * Replaces the `history: true` boolean config in defineApp.
 *
 * @example
 *   defineApp("todo", INITIAL, { modules: [history()] });
 */

import { createHistoryMiddleware } from "@/os/middlewares/historyKernelMiddleware";
import type { AppModule } from "./types";

export function history(): AppModule {
  return {
    id: "history",
    install({ appId, scope }) {
      return createHistoryMiddleware(appId, scope);
    },
  };
}
