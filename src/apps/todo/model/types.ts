import type { InferredTodoCommand } from "@apps/todo/features/commands/index";
import type { OSCommand } from "@os/core/command/osCommands";

export * from "@apps/todo/model/appState";

export type TodoCommand = InferredTodoCommand | OSCommand;

// Extract just the IDs (e.g. "ADD_TODO" | "DELETE_TODO" | ...)
export type TodoCommandId = TodoCommand["type"];

