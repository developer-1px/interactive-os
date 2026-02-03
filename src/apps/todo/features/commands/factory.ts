import type { AppState } from "@apps/todo/model/appState";
import { createCommandFactory } from "@os/core/command/definition";

// Generic Factory (Global)
export const defineGlobalCommand = createCommandFactory<AppState>();

// Zone-Specific Factories
// These commands will automatically carry the Zone ID
export const defineSidebarCommand = createCommandFactory<AppState>("sidebar");
export const defineListCommand = createCommandFactory<AppState>("listView");
