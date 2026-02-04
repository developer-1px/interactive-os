// Focus Behavior Resolver
import type { FocusBehavior } from "./behaviorTypes";
import { FOCUS_PRESETS } from "./behaviorPresets";

/**
 * Resolves the final FocusBehavior by merging:
 * 1. Base defaults (Safe Fallback)
 * 2. Role-based Preset (Pattern)
 * 3. Explicit Overrides (Customization)
 */
export function resolveBehavior(
    role?: string,
    overrides?: Partial<FocusBehavior>
): FocusBehavior {
    const base: FocusBehavior = {
        direction: "none",
        edge: "stop",
        tab: "escape",
        target: "real",
        entry: "first",
        restore: false,
    };

    const preset = role ? FOCUS_PRESETS[role] : {};

    // Explicit overrides take precedence over preset, preset over base
    return { ...base, ...preset, ...overrides };
}

// Re-export types for convenience
export type { FocusBehavior, FocusDirection, FocusEdge, FocusTab, FocusTarget, FocusEntry } from "./behaviorTypes";
export { FOCUS_PRESETS } from "./behaviorPresets";
