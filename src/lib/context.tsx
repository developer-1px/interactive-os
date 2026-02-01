import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { logger } from './logger';
import type { ReactNode, FC } from 'react';

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
    const orParts = expression.split('||').map(s => s.trim());
    if (orParts.length > 1) {
        const evaluators = orParts.map(_compile);
        return (ctx) => evaluators.some(fn => fn(ctx));
    }

    // B. AND (&&) Logic
    const andParts = expression.split('&&').map(s => s.trim());
    if (andParts.length > 1) {
        const evaluators = andParts.map(_compile);
        return (ctx) => evaluators.every(fn => fn(ctx));
    }

    // C. NOT (!) Logic
    if (expression.startsWith('!')) {
        const subEvaluator = _compile(expression.slice(1).trim());
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



    // F. Direct Key Truthy Check
    const key = expression;
    return (ctx) => !!ctx[key];
}

/**
 * Compiles a 'when' clause string into a reusable function (Evaluator).
 * Optimized with a compilation cache to prevent redundant parsing and logging.
 */
export function compileWhen(expression: string | undefined): Evaluator {
    if (!expression) return () => true;

    if (compilationCache.has(expression)) {
        return compilationCache.get(expression)!;
    }

    logger.debug('CONTEXT', `Compiling new expression: "${expression}"`);
    const evaluator = _compile(expression);
    compilationCache.set(expression, evaluator);
    return evaluator;
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

    const pendingLogUpdates = useRef<ContextState>({});
    const logTimeoutRef = useRef<any>(null);

    const setContext = useCallback((key: ContextKey, value: ContextValue) => {
        setCtx(prev => (prev[key] === value ? prev : { ...prev, [key]: value }));
    }, []);

    const updateContext = useCallback((updates: ContextState) => {
        setCtx(prev => {
            const keys = Object.keys(updates);
            const hasChanged = keys.some(k => prev[k] !== updates[k]);

            if (!hasChanged) return prev;

            // Debounced Logging: Accumulate updates and log once every 500ms
            Object.assign(pendingLogUpdates.current, updates);

            if (logTimeoutRef.current) {
                clearTimeout(logTimeoutRef.current);
            }

            logTimeoutRef.current = setTimeout(() => {
                logger.debug('CONTEXT', 'Sync (Debounced) ->', { ...pendingLogUpdates.current });
                pendingLogUpdates.current = {}; // Reset after log
                logTimeoutRef.current = null;
            }, 500);

            return { ...prev, ...updates };
        });
    }, []);

    const value = useMemo(() => ({ context, setContext, updateContext }), [context, setContext, updateContext]);

    return (
        <GlobalContext.Provider value={value}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useContextService = () => useContext(GlobalContext);
