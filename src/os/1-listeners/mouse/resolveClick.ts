/**
 * resolveClick — Pure click event resolution
 *
 * Tree interaction model:
 *   1. Chevron (ExpandTrigger) click → OS_EXPAND only (handled by ExpandTrigger, skipped here)
 *   2. New item click (clickedItemId ≠ focusedItemId) → no-op (mousedown handled focus+select)
 *   3. Re-click on already-focused expandable item → OS_EXPAND toggle
 *   4. Re-click on already-focused leaf item → OS_ACTIVATE
 *   5. aria-current="page" item → OS_ACTIVATE immediately (regardless of focus state)
 *
 * mousedown: focus + select (immediate visual feedback)
 * click:     action — but ONLY when re-clicking the same item, or aria-current page
 */

import { OS_ACTIVATE } from "@os/3-commands";
import type { ResolveResult } from "../shared";

export interface ClickInput {
  activateOnClick: boolean;
  /** Item that was clicked (from DOM sense) */
  clickedItemId: string | null;
  /** Currently focused item in the zone */
  focusedItemId: string | null;
  /** Whether the clicked item has aria-current="page" */
  isCurrentPage?: boolean;
  /** Whether an item was being edited before this click (pre-mousedown state) */
  wasEditing?: boolean;
}

export function resolveClick(input: ClickInput): ResolveResult {
  const noOp: ResolveResult = {
    commands: [],
    meta: null,
    preventDefault: false,
    fallback: false,
  };

  if (!input.activateOnClick || !input.clickedItemId) return noOp;

  // aria-current="page" → activate immediately (re-selecting current doc)
  if (input.isCurrentPage) {
    return {
      commands: [OS_ACTIVATE() as any],
      meta: {
        input: { type: "MOUSE", key: "click", elementId: input.clickedItemId },
      },
      preventDefault: false,
      fallback: false,
    };
  }

  // Editing continuation: if user was editing and clicks a different item,
  // activate it so onAction (e.g. drillDown) can start editing on the new item.
  if (input.wasEditing && input.clickedItemId !== input.focusedItemId) {
    return {
      commands: [OS_ACTIVATE() as any],
      meta: {
        input: { type: "MOUSE", key: "click", elementId: input.clickedItemId },
      },
      preventDefault: false,
      fallback: false,
    };
  }

  // New item click: mousedown already did focus+select — nothing more to do
  if (input.clickedItemId !== input.focusedItemId) return noOp;

  // Re-click on already-focused item → activate (OS_ACTIVATE handles expand vs action)
  return {
    commands: [OS_ACTIVATE() as any],
    meta: {
      input: { type: "MOUSE", key: "click", elementId: input.clickedItemId },
    },
    preventDefault: false,
    fallback: false,
  };
}
