export type LogicOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'and' | 'or';

export interface LogicNode {
    op: LogicOp;
    key?: string;
    val?: any;
    ref?: string; // Reference to another context key
    left?: LogicNode;
    right?: LogicNode;
    // For serialization/debugging convenience
    description?: string;
}

export class ComparisonBuilder<T, K extends keyof T> {
    private k: K;
    constructor(k: K) {
        this.k = k;
    }

    eq(val: T[K]): LogicNode {
        return { op: 'eq', key: String(this.k), val, description: `${String(this.k)} == ${val}` };
    }
    neq(val: T[K]): LogicNode {
        return { op: 'neq', key: String(this.k), val, description: `${String(this.k)} != ${val}` };
    }
    // Numeric operations (only if T[K] is number)
    gt(val: T[K] extends number ? number : never): LogicNode {
        return { op: 'gt', key: String(this.k), val, description: `${String(this.k)} > ${val}` };
    }
    gte(val: T[K] extends number ? number : never): LogicNode {
        return { op: 'gte', key: String(this.k), val, description: `${String(this.k)} >= ${val}` };
    }
    lt(val: T[K] extends number ? number : never): LogicNode {
        return { op: 'lt', key: String(this.k), val, description: `${String(this.k)} < ${val}` };
    }
    lte(val: T[K] extends number ? number : never): LogicNode {
        return { op: 'lte', key: String(this.k), val, description: `${String(this.k)} <= ${val}` };
    }

    // Key-to-Key Comparisons
    ltKey(otherKey: keyof T): LogicNode {
        return { op: 'lt', key: String(this.k), ref: String(otherKey), description: `${String(this.k)} < ${String(otherKey)}` };
    }
    gtKey(otherKey: keyof T): LogicNode {
        return { op: 'gt', key: String(this.k), ref: String(otherKey), description: `${String(this.k)} > ${String(otherKey)}` };
    }

    // Boolean shortcuts
    isTrue(): LogicNode {
        return { op: 'eq', key: String(this.k), val: true, description: `${String(this.k)} is true` };
    }
    isFalse(): LogicNode {
        return { op: 'eq', key: String(this.k), val: false, description: `${String(this.k)} is false` };
    }
}

export class RuleBuilder<T> {
    key<K extends keyof T>(k: K) {
        return new ComparisonBuilder<T, K>(k);
    }

    // Logical combinations
    and(left: LogicNode, right: LogicNode): LogicNode {
        return { op: 'and', left, right, description: `(${left.description} AND ${right.description})` };
    }

    or(left: LogicNode, right: LogicNode): LogicNode {
        return { op: 'or', left, right, description: `(${left.description} OR ${right.description})` };
    }
}

// Global helper to instantiate
export function Rule<T>() {
    return new RuleBuilder<T>();
}

/**
 * Internal helper to create the Expect object
 */
function _createExpectBuilder<T>(key: keyof T) {
    // We cast to any to instantiate ComparisonBuilder easily, strict types are enforced by the return signature
    const builder = new ComparisonBuilder<T, typeof key>(key);

    return {
        toBe: (val: T[typeof key]) => builder.eq(val),
        not: {
            toBe: (val: T[typeof key]) => builder.neq(val),
        },
        // Numeric
        // We use 'any' for the input to avoid weird 'never' inference on conditional types
        // in the specific context of the return object. The builder.gt check will still be structurally valid.
        // But to be cleaner, we can cast builder to 'any' for the numeric methods or just accept the looseness
        // because we know 'key' is constrained by keyof T.
        // Actually, the issue is T[key] check.

        toBeGreaterThan: (val: number) => builder.gt(val as any),
        toBeLessThan: (val: number) => builder.lt(val as any),
        toBeGreaterThanOrEqual: (val: number) => builder.gte(val as any),
        toBeLessThanOrEqual: (val: number) => builder.lte(val as any),

        // Boolean
        toBeTruthy: () => builder.isTrue(),
        toBeFalsy: () => builder.isFalse(),

        // Dynamic Keys (Ref)
        toBeLessThanKey: (otherKey: keyof T) => builder.ltKey(otherKey),
        toBeGreaterThanKey: (otherKey: keyof T) => builder.gtKey(otherKey),
    };
}

/**
 * Factory: Creates a typed 'Expect' function for a specific Context.
 * Example: const Expect = createLogicExpect<TodoContext>();
 */
export function createLogicExpect<T>() {
    return function Expect(key: keyof T) {
        return _createExpectBuilder<T>(key);
    };
}

/**
 * Factory: Creates a typed 'Rule' builder for a specific Context.
 * Example: const Rule = createLogicRule<TodoContext>();
 */
export function createLogicRule<T>() {
    return new RuleBuilder<T>();
}

// Deprecated: Direct export (kept for backward compat or quick usage if needed, but Factory is preferred)
export function Expect<T>(key: keyof T) {
    return _createExpectBuilder<T>(key);
}
