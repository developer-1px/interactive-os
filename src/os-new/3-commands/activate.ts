/**
 * OS_ACTIVATE Command — Enter key activation (kernel version)
 *
 * Behavior:
 * - If treeitem/menuitem: toggle expansion (via OS_EXPAND dispatch)
 * - Otherwise: trigger CLICK effect on focused element
 *
 * Note: DOM role checking is deferred to scoped handler phase.
 * For now, the command simply triggers a click effect.
 * Apps can override this via scoped handlers in Phase 5.
 */

import { kernel } from "../kernel";

export const ACTIVATE = kernel.defineCommand("OS_ACTIVATE", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  if (!zone?.focusedItemId) return;

  return {
    click: zone.focusedItemId,
  };
});
