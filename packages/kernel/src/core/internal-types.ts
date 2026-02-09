import type { Command, ContextToken, ScopeToken } from "./tokens.ts";

/** Internal command handler (curried: ctx → payload → effects) */
export type InternalCommandHandler = (ctx: any) => (payload?: any) => any;

/** Internal effect handler (untyped) */
export type InternalEffectHandler = (value: any) => void;

/** Middleware context (used by middleware hooks) */
export type MiddlewareContext = {
  command: Command;
  state: unknown;
  handlerScope: string;
  effects: Record<string, unknown> | null;
  injected: Record<string, unknown>;
};

/** Middleware type */
export type Middleware = {
  id: string;
  scope?: ScopeToken;
  before?: (ctx: MiddlewareContext) => MiddlewareContext;
  after?: (ctx: MiddlewareContext) => MiddlewareContext;
};
