/**
 * Pipeline Phase 2: RESOLVE
 *
 * Matches KeyboardIntent to a Keybinding via hierarchical lookup.
 */

export {
    resolveKeybinding,
    buildBubblePath,
    type KeybindingEntry,
    type ResolveContext,
    type ResolvedBinding,
} from './resolveKeybinding';
