import type { InferredTodoCommand } from './todoCommands';

export type TodoCommand = InferredTodoCommand;

// Extract just the IDs (e.g. "ADD_TODO" | "DELETE_TODO" | ...)
export type TodoCommandId = TodoCommand['type'];
