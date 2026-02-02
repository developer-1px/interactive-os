import type { AppState, OSEnvironment } from "../types";
import { createCommandFactory } from "../definition";

export const defineCommand = createCommandFactory<AppState, OSEnvironment>();
