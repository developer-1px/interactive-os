/**
 * AppModule — OS Module Interface
 *
 * Modules are composable behavior units that apps install
 * via `defineApp({ modules: [...] })`.
 *
 * Each module returns middleware(s) that hook into the kernel pipeline.
 * Install = add to array. Uninstall = remove from array. Zero core changes.
 *
 * Pattern: Vite Plugin / ESLint Flat Config
 *
 * @example
 *   defineApp("builder", INITIAL_STATE, {
 *     modules: [
 *       history(),
 *       persistence({ key: "builder" }),
 *       deleteToast(),
 *     ],
 *   });
 */

import type { Middleware, ScopeToken } from "@kernel/core/tokens";

/** Context provided to module's install function */
export interface ModuleInstallContext {
  /** App ID this module is being installed into */
  appId: string;
  /** Kernel scope token for this app */
  scope: ScopeToken;
}

/** App Module — installable behavior unit */
export interface AppModule {
  /** Unique module identifier */
  id: string;
  /** Install the module: returns middleware(s) to register on the kernel */
  install(ctx: ModuleInstallContext): Middleware | Middleware[];
}
