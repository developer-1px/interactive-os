/**
 * OS_VALUE_CHANGE Command — Adjust value for slider/spinbutton/separator
 *
 * Pure function that resolves the next value given current state and action.
 */

export type ValueAction =
    | "increment"
    | "decrement"
    | "incrementLarge"
    | "decrementLarge"
    | "setMin"
    | "setMax"
    | "set";

export interface ValueChangeResult {
    changed: boolean;
    newValue: number;
}

export function resolveValueChange(
    currentValue: number,
    action: ValueAction,
    config: { min: number; max: number; step: number; largeStep: number },
    targetValue?: number,
): ValueChangeResult {
    const { min, max, step, largeStep } = config;
    let newValue = currentValue;

    switch (action) {
        case "increment":
            newValue = currentValue + step;
            break;
        case "decrement":
            newValue = currentValue - step;
            break;
        case "incrementLarge":
            newValue = currentValue + largeStep;
            break;
        case "decrementLarge":
            newValue = currentValue - largeStep;
            break;
        case "setMin":
            newValue = min;
            break;
        case "setMax":
            newValue = max;
            break;
        case "set":
            newValue = targetValue ?? currentValue;
            break;
    }

    // Clamp to [min, max]
    newValue = Math.min(max, Math.max(min, newValue));

    // Round to step precision to avoid floating point issues
    const precision = Math.max(
        (step.toString().split(".")[1] || "").length,
        (largeStep.toString().split(".")[1] || "").length,
    );
    newValue = Number(newValue.toFixed(precision));

    return {
        changed: newValue !== currentValue,
        newValue,
    };
}
