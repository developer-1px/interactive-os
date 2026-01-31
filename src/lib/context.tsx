import { createContext, useContext, useState } from 'react';
import type { ReactNode, FC } from 'react';

export type ContextKey = string;
export type ContextValue = boolean | string | number | null | undefined;
export type ContextState = Record<ContextKey, ContextValue>;

// --- 1. Compiled Evaluator Pattern ---

type Evaluator = (context: ContextState) => boolean;

/**
 * Compiles a 'when' clause string into a reusable function (Evaluator).
 * This optimization moves O(N) string parsing from Runtime-per-Keystroke to Startup-Time.
 */
export function compileWhen(expression: string | undefined): Evaluator {
    if (!expression) return () => true;

    // A. OR (||) Logic
    const orParts = expression.split('||').map(s => s.trim());
    if (orParts.length > 1) {
        const evaluators = orParts.map(compileWhen); // Recursive compile
        return (ctx) => evaluators.some(fn => fn(ctx));
    }

    // B. AND (&&) Logic
    const andParts = expression.split('&&').map(s => s.trim());
    if (andParts.length > 1) {
        const evaluators = andParts.map(compileWhen); // Recursive compile
        return (ctx) => evaluators.every(fn => fn(ctx));
    }

    // C. NOT (!) Logic
    if (expression.startsWith('!')) {
        const subEvaluator = compileWhen(expression.slice(1).trim());
        return (ctx) => !subEvaluator(ctx);
    }

    // D. Equality (==, !=)
    if (expression.includes('==')) {
        const [key, val] = expression.split('==').map(s => s.trim());
        const parsedVal = parseValue(val);
        return (ctx) => ctx[key] == parsedVal;
    }
    if (expression.includes('!=')) {
        const [key, val] = expression.split('!=').map(s => s.trim());
        const parsedVal = parseValue(val);
        return (ctx) => ctx[key] != parsedVal;
    }

    // E. Direct Key Truthy Check
    const key = expression;
    return (ctx) => !!ctx[key];
}

/**
 * Legacy immediate evaluator (wraps compiler for backward compat/testing)
 */
export function evalContext(expression: string | undefined, context: ContextState): boolean {
    return compileWhen(expression)(context);
}

function parseValue(val: string): string | number | boolean | null {
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val === 'null') return null;
    if (!isNaN(Number(val))) return Number(val);
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        return val.slice(1, -1);
    }
    return val;
}

// --- React Context Integration ---

const GlobalContext = createContext<{
    context: ContextState;
    setContext: (key: ContextKey, value: ContextValue) => void;
    updateContext: (updates: ContextState) => void;
}>({ context: {}, setContext: () => { }, updateContext: () => { } });

export const ContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [context, setCtx] = useState<ContextState>({});

    const setContext = (key: ContextKey, value: ContextValue) => {
        setCtx(prev => (prev[key] === value ? prev : { ...prev, [key]: value }));
    };

    const updateContext = (updates: ContextState) => {
        setCtx(prev => {
            const next = { ...prev, ...updates };
            if (Object.keys(updates).every(k => prev[k] === updates[k])) return prev;
            return next;
        });
    };

    return (
        <GlobalContext.Provider value={{ context, setContext, updateContext }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useContextService = () => useContext(GlobalContext);
