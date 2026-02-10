import type { OSCommandUnion as OSCommand } from "@/os-new/schema/command/OSCommandPayload";

export * from "@apps/kanban/model/appState";

export type KanbanCommand = OSCommand | { type: string; payload?: any };
export type KanbanCommandId = string;
