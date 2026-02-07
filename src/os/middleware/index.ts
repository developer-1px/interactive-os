/**
 * OS Built-in Middleware
 *
 * Auto-applied by createEngine to all apps.
 * Apps can still add custom middleware via AppDefinition.middleware.
 *
 * Execution order: navigation → history → app middleware
 */

export { navigationMiddleware } from "./navigationMiddleware";
export { historyMiddleware } from "./historyMiddleware";
export type {
    HistoryEntry,
    HistoryState,
    OSManagedState,
    OSMiddleware,
} from "./types";
