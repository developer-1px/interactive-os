/**
 * resolveClick — Pure click event resolution
 *
 * Decides whether a click should trigger OS_ACTIVATE.
 * mousedown already handled focus+select — click only triggers action.
 *
 * Activate when: re-click on focused item, or aria-current="page", or was editing.
 * No-op when: new item click (mousedown already handled).
 */

import type { BaseCommand } from "@kernel/core/tokens";
import { OS_ACTIVATE } from "@os-core/4-command";
import type { ResolveResult } from "../_shared/domQuery";

export interface ClickInput {
  activateOnClick: boolean;
  clickedItemId: string | null;
  focusedItemId: string | null;
  isCurrentPage?: boolean;
  wasEditing?: boolean;
  /** inputmap click commands to dispatch instead of OS_ACTIVATE */
  actionCommands?: BaseCommand[];
}

const NO_OP: ResolveResult = {
  commands: [],
  meta: null,
  preventDefault: false,
  fallback: false,
};

export function resolveClick(input: ClickInput): ResolveResult {
  if (!input.activateOnClick || !input.clickedItemId) return NO_OP;

  // Should activate?
  // - Re-click on same item (double-click to edit, expand, etc.)
  // - aria-current="page" (re-selecting current doc)
  // - Was editing + clicked different item (drillDown continuation)
  const isReclick = input.clickedItemId === input.focusedItemId;
  const shouldActivate = isReclick || input.isCurrentPage || input.wasEditing;

  if (!shouldActivate) return NO_OP;

  return {
    commands: input.actionCommands ?? [OS_ACTIVATE()],
    meta: {
      input: { type: "MOUSE", key: "click", elementId: input.clickedItemId },
    },
    preventDefault: false,
    fallback: false,
  };
}
