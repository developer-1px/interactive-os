import type { KanbanState } from "@apps/kanban/model/appState";
import { createCommandFactory } from "@os/features/command/lib/createCommandFactory";

// Global Factory
export const defineKanbanCommand = createCommandFactory<KanbanState>();

// Zone-Specific Factories
export const defineBoardCommand = createCommandFactory<KanbanState>("kanban-board");
export const defineColumnCommand = createCommandFactory<KanbanState>();
