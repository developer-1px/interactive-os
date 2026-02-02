import type { InferredTodoCommand } from "@apps/todo/features/commands/index";

export type TodoCommand = InferredTodoCommand;

// Extract just the IDs (e.g. "ADD_TODO" | "DELETE_TODO" | ...)
export type TodoCommandId = TodoCommand["type"];
