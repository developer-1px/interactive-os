/**
 * dispatch.ts — Re-export for backward compatibility.
 *
 * Dispatch is now part of registry.ts to avoid circular dependencies.
 * This file re-exports for any existing imports.
 */

export { dispatch } from "./registry.ts";
