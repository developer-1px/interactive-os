import type { OSCommandUnion as OSCommand } from "@/os/schema/command/OSCommandPayload";

export * from "@apps/todo/model/appState";

export type TodoCommand = OSCommand | { type: string; payload?: any };

// Extract just the IDs
export type TodoCommandId = string;
