import type { AppState } from "@apps/todo/model/appState";
import { createCommandFactory } from "@os/core/command/definition";

export const defineCommand = createCommandFactory<AppState>();
