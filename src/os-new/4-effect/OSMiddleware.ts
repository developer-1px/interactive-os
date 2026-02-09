/**
 * OSMiddleware — Redux-style next 패턴 미들웨어
 */
export type Next<S, A> = (state: S, action: A) => S;
export type OSMiddleware<S = any, A = any> = (next: Next<S, A>) => Next<S, A>;
