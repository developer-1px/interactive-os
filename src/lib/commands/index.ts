import { CommandRegistry } from "../command";
import type { AppState, OSEnvironment } from "../types";

// Import all commands
import * as Global from "./global";
import * as Categories from "./categories";
import * as List from "./list";
import * as Navigation from "./navigation";
import * as Board from "./board";

// Construct Arrays for Grouping
export const GlobalCommands = Object.values(Global);
export const SideBarCommands = [
    ...Object.values(Categories),
    ...GlobalCommands,
];
export const TodoListCommands = [
    ...Object.values(List),
    ...Object.values(Navigation),
    ...GlobalCommands,
];

// Unified Command List (Flattened & Unique)
const ALL_COMMANDS = [
    ...new Set([
        ...GlobalCommands,
        ...SideBarCommands,
        ...TodoListCommands,
        ...Object.values(Board) // Don't forget Board
    ]),
];

// Inferred Union
export type InferredTodoCommand = ReturnType<(typeof ALL_COMMANDS)[number]>;

// Strict Registry
export type TodoCommandId = InferredTodoCommand["type"];
export const UNIFIED_TODO_REGISTRY = new CommandRegistry<AppState, TodoCommandId, OSEnvironment>();

// Register all
ALL_COMMANDS.forEach((cmd) => UNIFIED_TODO_REGISTRY.register(cmd));
