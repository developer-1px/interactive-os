/**
 * Shallow equality check for objects and arrays.
 * Used by useComputed to stabilize selector results.
 * 
 * SAFETY NOTE:
 * Only performs component-wise comparison for:
 * 1. Arrays
 * 2. Plain Objects (POJOs)
 * 
 * For complex types (Date, Map, Set, Class instances), it returns `false` 
 * if references differ, ensuring standard React update behavior (strict equality).
 */
export function shallow(objA: unknown, objB: unknown): boolean {
    if (Object.is(objA, objB)) {
        return true;
    }

    if (
        typeof objA !== "object" ||
        objA === null ||
        typeof objB !== "object" ||
        objB === null
    ) {
        return false;
    }

    // 1. Array handling
    if (Array.isArray(objA)) {
        if (!Array.isArray(objB)) {
            return false;
        }
        if (objA.length !== objB.length) {
            return false;
        }
        for (let i = 0; i < objA.length; i++) {
            if (!Object.is(objA[i], objB[i])) {
                return false;
            }
        }
        return true;
    }

    // 2. Plain Object handling (Strict safety for Set/Map/Date/etc)
    // If prototypes differ or are not Object.prototype (and not null for Object.create(null)),
    // we assume they are complex types and fallback to strict reference equality (which failed above).
    const protoA = Object.getPrototypeOf(objA);
    const protoB = Object.getPrototypeOf(objB);

    if (protoA !== Object.prototype || protoB !== Object.prototype) {
        // Allows objects with null prototype to be compared if both are null prototype
        if (protoA === null && protoB === null) {
            // Proceed to key check
        } else {
            return false;
        }
    }

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
        return false;
    }

    for (let i = 0; i < keysA.length; i++) {
        const key = keysA[i];
        if (
            !Object.prototype.hasOwnProperty.call(objB, key) ||
            !Object.is(
                (objA as Record<string, unknown>)[key],
                (objB as Record<string, unknown>)[key],
            )
        ) {
            return false;
        }
    }

    return true;
}
