import type { OSCommand } from "@os/core/command/osCommands";

export * from "@apps/todo/model/appState";

export type TodoCommand = OSCommand | { type: string; payload?: any };

// Extract just the IDs
export type TodoCommandId = string;

