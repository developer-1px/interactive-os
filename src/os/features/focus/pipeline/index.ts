/**
 * Focus Pipeline - Public API
 * 
 * 5-Phase Immutable Pipeline:
 * 1. INTERCEPT - Event capture
 * 2. PARSE - Key → Intent
 * 3. RESOLVE - State calculation
 * 4. COMMIT - Store update
 * 5. PROJECT - DOM reflection
 */

// Phase exports
export * from './intercept';
export * from './parse';
export * from './resolve';
export * from './commit';
export * from './project';

// ═══════════════════════════════════════════════════════════════════
// Pipeline Orchestrator
// ═══════════════════════════════════════════════════════════════════

import type { KeyboardEvent } from 'react';
import { interceptKeyboard, shouldIntercept } from './intercept';
import { parseIntent } from './parse';
import { resolveTarget, type FocusState, type ZoneConfig } from './resolve';
import { commitToStore } from './commit';
import { projectToDOM } from './project';

export interface PipelineContext {
    state: FocusState;
    zoneConfig: ZoneConfig;
}

/**
 * Execute the full 5-phase pipeline
 */
export function executePipeline(
    event: KeyboardEvent,
    context: PipelineContext
): boolean {
    // 1. INTERCEPT
    const intercepted = interceptKeyboard(event);
    if (!shouldIntercept(intercepted)) {
        return false;
    }

    // 2. PARSE
    const intent = parseIntent(intercepted);
    if (intent.type === 'UNKNOWN') {
        return false;
    }

    // 3. RESOLVE
    const target = resolveTarget(context.state, intent, context.zoneConfig);

    // 4. COMMIT
    const result = commitToStore(target);

    // 5. PROJECT
    projectToDOM(result);

    // Prevent default if needed
    if (target.shouldPreventDefault) {
        event.preventDefault();
        event.stopPropagation();
    }

    return true;
}
