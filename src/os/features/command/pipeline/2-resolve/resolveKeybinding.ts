/**
 * resolveKeybinding - Command Pipeline Phase 2: RESOLVE
 *
 * Responsibility: Match KeyboardIntent to a single Keybinding.
 *
 * Input:  KeyboardIntent + keybindings + focusPath
 * Output: ResolvedBinding | null
 *
 * This is a PURE function - no side effects, no state mutations.
 * It performs hierarchical lookup and 'when' clause evaluation.
 */

import type { KeyboardIntent } from '../1-intercept';
import { normalizeKeyDefinition } from '@os/features/input/lib/getCanonicalKey';
import { evalContext } from '@os/features/AntigravityOS';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface KeybindingEntry {
    key: string;
    command: string;
    args?: Record<string, unknown>;
    when?: string;
    groupId?: string;
    allowInInput?: boolean;
}

export interface ResolveContext {
    activeGroup?: string;
    focusPath: string[];
    focusedItemId: string | null;
    [key: string]: unknown;
}

export interface ResolvedBinding {
    /** The matched keybinding entry */
    binding: KeybindingEntry;

    /** Resolved arguments (OS.FOCUS expanded) */
    resolvedArgs: Record<string, unknown> | undefined;
}

// ═══════════════════════════════════════════════════════════════════
// Main Function
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve a KeyboardIntent to a single keybinding using hierarchical lookup.
 *
 * Resolution order:
 * 1. Match keybindings by canonicalKey
 * 2. Bubble through focusPath (deepest → root → global)
 * 3. Evaluate 'when' clauses
 * 4. Return first match or null
 *
 * @param intent - The keyboard intent from Phase 1
 * @param bindings - All available keybindings (app + OS merged)
 * @param context - Evaluation context for 'when' clauses
 * @param bubblePath - Focus path to bubble through (reversed focusPath + "global")
 */
export function resolveKeybinding(
    intent: KeyboardIntent,
    bindings: KeybindingEntry[],
    context: ResolveContext,
    bubblePath: string[]
): ResolvedBinding | null {
    const { canonicalKey, isFromInput } = intent;

    // Step 1: Filter bindings by key
    const keyMatches = bindings.filter(
        (b) => normalizeKeyDefinition(b.key) === canonicalKey
    );

    if (keyMatches.length === 0) return null;

    // Step 2: Bubble through focus path
    for (const layerId of bubblePath) {
        const isGlobal = layerId === 'global';

        // Filter bindings for this layer
        const layerBindings = keyMatches.filter((b) => {
            if (isGlobal) return !b.groupId;
            return b.groupId === layerId;
        });

        // Step 3: Evaluate each binding
        for (const binding of layerBindings) {
            const evaluationCtx = { ...context, isInput: isFromInput };

            // Skip if in input and not allowed
            if (isFromInput && !binding.allowInInput) continue;

            // Evaluate 'when' clause
            if (binding.when && !evalContext(binding.when, evaluationCtx)) continue;

            // Step 4: Resolve special args (OS.FOCUS etc.)
            const resolvedArgs = resolveArgs(binding.args, evaluationCtx);

            return {
                binding,
                resolvedArgs,
            };
        }
    }

    return null;
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve special argument placeholders.
 * Currently supports: OS.FOCUS → focusedItemId
 */
function resolveArgs(
    args: Record<string, unknown> | undefined,
    context: ResolveContext
): Record<string, unknown> | undefined {
    if (!args || typeof args !== 'object') return args;

    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(args)) {
        if (value === 'OS.FOCUS') {
            resolved[key] = context.focusedItemId;
        } else {
            resolved[key] = value;
        }
    }

    return resolved;
}

// ═══════════════════════════════════════════════════════════════════
// Utility: Build Bubble Path
// ═══════════════════════════════════════════════════════════════════

/**
 * Build the bubble path from focus path.
 * Reverses the focus path (deepest first) and appends 'global'.
 */
export function buildBubblePath(
    focusPath: string[],
    fallbackGroupId?: string | null
): string[] {
    const path =
        focusPath.length > 0
            ? [...focusPath].reverse()
            : fallbackGroupId
                ? [fallbackGroupId]
                : [];

    path.push('global');
    return path;
}
