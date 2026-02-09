import { evalContext } from "./evalContext.ts";
import type { ContextState, LogicNode } from "./LogicNode.ts";

const wrap = (fn: (ctx: ContextState) => boolean, label: string): LogicNode =>
  Object.assign(fn, { toString: () => label });

const Expect = <T = any>(key: keyof T & string) => {
  const ex = {
    toBe: (v: any) =>
      wrap((c) => c[key] === v, `${key} == ${JSON.stringify(v)}`),
    gt: (v: number) => wrap((c) => Number(c[key]) > v, `${key} > ${v}`),
    gte: (v: number) => wrap((c) => Number(c[key]) >= v, `${key} >= ${v}`),
    lt: (v: number) => wrap((c) => Number(c[key]) < v, `${key} < ${v}`),
    lte: (v: number) => wrap((c) => Number(c[key]) <= v, `${key} <= ${v}`),
    toBeTruthy: () => wrap((c) => !!c[key], `!!${key}`),
    toBeFalsy: () => wrap((c) => !c[key], `!${key}`),
    toBeLessThanKey: (k2: string) =>
      wrap((c) => (c[key] as any) < (c[k2] as any), `${key} < ${k2}`),
  };
  return {
    ...ex,
    toBeGreaterThan: ex.gt,
    toBeLessThan: ex.lt,
    toBeGreaterThanOrEqual: ex.gte,
    toBeLessThanOrEqual: ex.lte,
    not: {
      toBe: (v: any) =>
        wrap((c) => c[key] !== v, `${key} != ${JSON.stringify(v)}`),
    },
  };
};

export const Rule = {
  and: (...fns: any[]): LogicNode =>
    wrap(
      (ctx) => fns.every((f) => evalContext(f, ctx)),
      `(${fns.join(" && ")})`,
    ),
  or: (...fns: any[]): LogicNode =>
    wrap(
      (ctx) => fns.some((f) => evalContext(f, ctx)),
      `(${fns.join(" || ")})`,
    ),
};

export const createLogicExpect =
  <T>() =>
  (k: keyof T & string) =>
    Expect<T>(k);
