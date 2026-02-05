/**
 * Focus Registry - Public API
 */

export { roleRegistry, registerRole, getRole } from './roleRegistry';
export { resolveRole } from './resolveRole';
export type { ResolvedFocusGroup } from './resolveRole';
export { DOMInterface } from './DOMInterface';
export { resolveBehavior } from './behaviorResolver';
export { FOCUS_PRESETS } from './behaviorPresets';
