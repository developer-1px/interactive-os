// Focus Behavior Resolver
import { FOCUS_PRESETS } from "./behaviorPresets";
import type { FocusBehavior } from "@os/entities/FocusBehavior";

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
