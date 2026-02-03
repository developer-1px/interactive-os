import { CommandRegistry } from "@os/core/command/store";
import type { AppState } from "@apps/todo/model/appState";

// Import all commands
import * as Global from "@apps/todo/features/commands/global";
import * as Categories from "@apps/todo/features/commands/categories";
import * as List from "@apps/todo/features/commands/list";
import * as Navigation from "@apps/todo/features/commands/navigation";
import * as Board from "@apps/todo/features/commands/board";

// Construct Arrays for Grouping
const GlobalCommands = Object.values(Global);
const SideBarCommands = [
    ...Object.values(Categories),
    ...GlobalCommands,
];
const TodoListCommands = [
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
export const UNIFIED_TODO_REGISTRY = new CommandRegistry<AppState, TodoCommandId>();

// Register all
console.log("[TODO ENGINE] Registering commands:", ALL_COMMANDS.length);
ALL_COMMANDS.forEach((cmd) => UNIFIED_TODO_REGISTRY.register(cmd));
