/**
 * defineContext — register a context provider. Returns a ContextToken.
 *
 * @example
 *   const NOW = defineContext("NOW", () => Date.now());
 *
 *   // Use via group inject:
 *   const { defineCommand } = kernel.group({ inject: [NOW] });
 *   defineCommand("USE_TIME", (ctx) => {
 *     ctx.NOW;  // auto-typed as number
 *   });
 */
export { clearContextProviders, defineContext } from "./core/context.ts";
