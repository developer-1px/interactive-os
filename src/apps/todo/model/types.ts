import type { OSCommand } from "@os/features/command/definitions/commandsShell";

export * from "@apps/todo/model/appState";

export type TodoCommand = OSCommand | { type: string; payload?: any };

// Extract just the IDs
export type TodoCommandId = string;

