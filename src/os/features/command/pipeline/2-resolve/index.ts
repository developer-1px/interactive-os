/**
 * Pipeline Phase 2: RESOLVE
 *
 * Matches KeyboardIntent to a Keybinding via hierarchical lookup.
 */

export {
  buildBubblePath,
  type KeybindingEntry,
  type ResolveContext,
  type ResolvedBinding,
  resolveKeybinding,
} from "./resolveKeybinding";
