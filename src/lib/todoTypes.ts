import type { InferredTodoCommand } from "./commands";

export type TodoCommand = InferredTodoCommand;

// Extract just the IDs (e.g. "ADD_TODO" | "DELETE_TODO" | ...)
export type TodoCommandId = TodoCommand["type"];
