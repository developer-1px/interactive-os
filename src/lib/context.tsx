import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { logger } from "./logger";
import type { ReactNode, FC } from "react";
import type { LogicNode } from "./logic/builder";

export type ContextKey = string;
export type ContextValue = boolean | string | number | null | undefined;
export type ContextState = Record<ContextKey, ContextValue>;

// --- 1. Condition & Evaluator Pattern ---

type Evaluator = (context: ContextState) => boolean;

const compilationCache = new Map<string, Evaluator>();

/**
 * Internal recursive compiler
 */
function _compile(expression: string): Evaluator {
  // A. OR (||) Logic
  const orParts = expression.split("||").map((s) => s.trim());
  if (orParts.length > 1) {
    const evaluators = orParts.map(_compile);
    return (ctx) => evaluators.some((fn) => fn(ctx));
  }

  // B. AND (&&) Logic
  const andParts = expression.split("&&").map((s) => s.trim());
  if (andParts.length > 1) {
    const evaluators = andParts.map(_compile);
    return (ctx) => evaluators.every((fn) => fn(ctx));
  }

  // C. NOT (!) Logic
  if (expression.startsWith("!")) {
    const subEvaluator = _compile(expression.slice(1).trim());
    return (ctx) => !subEvaluator(ctx);
  }

  // D. Equality (==, !=)
  if (expression.includes("==")) {
    const [key, val] = expression.split("==").map((s) => s.trim());
    const parsedVal = parseValue(val);
    return (ctx) => ctx[key] == parsedVal;
  }
  if (expression.includes("!=")) {
    const [key, val] = expression.split("!=").map((s) => s.trim());
    const parsedVal = parseValue(val);
    return (ctx) => ctx[key] != parsedVal;
  }

  // F. Direct Key Truthy Check
  const key = expression;
  return (ctx) => !!ctx[key];
}

/**
 * recursively evaluates a LogicNode tree
 */
function evalNode(node: LogicNode, ctx: ContextState): boolean {
  if (node.op === "and")
    return evalNode(node.left!, ctx) && evalNode(node.right!, ctx);
  if (node.op === "or")
    return evalNode(node.left!, ctx) || evalNode(node.right!, ctx);

  // Comparison
  if (!node.key) return false;
  const leftVal = ctx[node.key];

  // Resolve right value: either dynamic ref or static val
  // We treat null/undefined as 0 or false depending on context?
  // For now, strict comparison.
  const rightVal = node.ref ? ctx[node.ref] : node.val;

  switch (node.op) {
    case "eq":
      return leftVal == rightVal;
    case "neq":
      return leftVal != rightVal;
    case "gt":
      return Number(leftVal) > Number(rightVal);
    case "gte":
      return Number(leftVal) >= Number(rightVal);
    case "lt":
      return Number(leftVal) < Number(rightVal);
    case "lte":
      return Number(leftVal) <= Number(rightVal);
  }
  return false;
}

/**
 * Compiles a 'when' clause string into a reusable function (Evaluator).
 * Optimized with a compilation cache to prevent redundant parsing and logging.
 */
export function compileWhen(
  expression: string | LogicNode | undefined,
): Evaluator {
  if (!expression) return () => true;

  // Handle LogicNode (Builder)
  if (typeof expression !== "string") {
    const node = expression;
    return (ctx) => evalNode(node, ctx);
  }

  // Handle Legacy String
  if (compilationCache.has(expression)) {
    return compilationCache.get(expression)!;
  }

  logger.debug("CONTEXT", `Compiling new expression: "${expression}"`);
  const evaluator = _compile(expression);
  compilationCache.set(expression, evaluator);
  return evaluator;
}

/**
 * Legacy immediate evaluator (wraps compiler for backward compat/testing)
 */
export function evalContext(
  expression: string | LogicNode | undefined,
  context: ContextState,
): boolean {
  return compileWhen(expression)(context);
}

function parseValue(value: string): string | number | boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (!isNaN(Number(value))) return Number(value);
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

// --- React Context Integration ---

const GlobalContext = createContext<{
  context: ContextState;
  setContext: (key: ContextKey, value: ContextValue) => void;
  updateContext: (updates: ContextState) => void;
}>({ context: {}, setContext: () => {}, updateContext: () => {} });

export const ContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [context, setCtx] = useState<ContextState>({});

  const pendingLogUpdates = useRef<ContextState>({});
  const logTimeoutRef = useRef<any>(null);

  const setContext = useCallback((key: ContextKey, value: ContextValue) => {
    setCtx((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const updateContext = useCallback((updates: ContextState) => {
    setCtx((prev) => {
      const keys = Object.keys(updates);
      const hasChanged = keys.some((k) => prev[k] !== updates[k]);

      if (!hasChanged) return prev;

      // Debounced Logging: Accumulate updates and log once every 500ms
      Object.assign(pendingLogUpdates.current, updates);

      if (logTimeoutRef.current) {
        clearTimeout(logTimeoutRef.current);
      }

      logTimeoutRef.current = setTimeout(() => {
        logger.debug("CONTEXT", "Sync (Debounced) ->", {
          ...pendingLogUpdates.current,
        });
        pendingLogUpdates.current = {}; // Reset after log
        logTimeoutRef.current = null;
      }, 500);

      return { ...prev, ...updates };
    });
  }, []);

  const value = useMemo(
    () => ({ context, setContext, updateContext }),
    [context, setContext, updateContext],
  );

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};

export const useContextService = () => useContext(GlobalContext);
