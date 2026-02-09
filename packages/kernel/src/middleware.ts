/**
 * middleware.ts — Re-export for backward compatibility.
 *
 * Middleware types and registration are now in registry.ts.
 */

export type { Middleware, MiddlewareContext } from "./registry.ts";
export {
  clearAllRegistries as clearMiddlewares,
  registerMiddleware as use,
} from "./registry.ts";
