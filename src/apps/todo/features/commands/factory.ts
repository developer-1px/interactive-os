import type { AppState, OSEnvironment } from "@apps/todo/model/types";
import { createCommandFactory } from "@os/core/command/definition";

export const defineCommand = createCommandFactory<AppState, OSEnvironment>();
