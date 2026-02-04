import type { ContextState, LogicNode } from "../LogicNode";

const cache = new Map<string, (ctx: ContextState) => boolean>();

const _compile = (expr: string): ((ctx: ContextState) => boolean) => {
    if (expr.includes("||")) return (c) => expr.split("||").some(p => _compile(p.trim())(c));
    if (expr.includes("&&")) return (c) => expr.split("&&").every(p => _compile(p.trim())(c));
    if (expr.startsWith("!")) return (c) => !_compile(expr.slice(1).trim())(c);
    if (expr.includes("==")) {
        const [k, v] = expr.split("==").map(s => s.trim());
        const val = v === "true" ? true : v === "false" ? false : v === "null" ? null : !isNaN(Number(v)) ? Number(v) : v.replace(/['"]/g, "");
        return (c) => c[k] == val;
    }
    return (c) => !!c[expr];
};

export function evalContext(expr: LogicNode | string | undefined, ctx: ContextState): boolean {
    if (!expr) return true;
    if (typeof expr === "function") return expr(ctx);
    if (!cache.has(expr)) cache.set(expr, _compile(expr));
    return cache.get(expr)!(ctx);
}
