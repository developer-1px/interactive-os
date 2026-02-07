import type { OSCommand } from "@os/features/command/definitions/commandsShell";

export * from "@apps/kanban/model/appState";

export type KanbanCommand = OSCommand | { type: string; payload?: any };
export type KanbanCommandId = string;
