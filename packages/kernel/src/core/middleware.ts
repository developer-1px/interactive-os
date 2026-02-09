import type { Middleware } from "./internal-types.ts";
import { scopedMiddleware } from "./registries.ts";
import { GLOBAL } from "./tokens.ts";

export function registerMiddleware(middleware: Middleware): void {
  const mwScope = (middleware.scope as string) ?? (GLOBAL as string);

  if (!scopedMiddleware.has(mwScope)) {
    scopedMiddleware.set(mwScope, []);
  }

  const list = scopedMiddleware.get(mwScope)!;

  // Dedup by id within scope
  const existing = list.findIndex((m) => m.id === middleware.id);
  if (existing !== -1) {
    list[existing] = middleware;
  } else {
    list.push(middleware);
  }
}
