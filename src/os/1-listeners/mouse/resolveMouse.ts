/**
 * resolveMouse — Pure mouse event resolution
 *
 * Translates sensed mouse data into actions (focus, select, expand).
 * No DOM access. No side effects. Pure function.
 *
 * W3C UI Events Module: Mouse Events (§3.4)
 */

// ═══════════════════════════════════════════════════════════════════
// Input / Output Types
// ═══════════════════════════════════════════════════════════════════

import { OS_ACTIVATE, OS_FOCUS, OS_SELECT } from "@os/3-commands";
import type { ResolveResult } from "../shared";

export interface MouseInput {
  /** Resolved item under the pointer, if any */
  targetItemId: string | null;
  targetGroupId: string | null;

  /** Modifier keys held during click */
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;

  /** Whether the item has a label (data-label + data-for) */
  isLabel: boolean;
  labelTargetItemId: string | null;
  labelTargetGroupId: string | null;

  /** Expansion data */
  hasAriaExpanded: boolean;
  /** Role of the item element (e.g. "treeitem", "button") */
  itemRole: string | null;
}

export type SelectMode = "replace" | "toggle" | "range";

// ═══════════════════════════════════════════════════════════════════
// Pure Resolution
// ═══════════════════════════════════════════════════════════════════


export function resolveSelectMode(input: {
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}): SelectMode {
  if (input.shiftKey) return "range";
  if (input.metaKey || input.ctrlKey) return "toggle";
  // APG: Alt+Click defaults to replace
  return "replace";
}

export function isClickExpandable(
  hasAriaExpanded: boolean,
  role: string | null,
): boolean {
  if (!hasAriaExpanded) return false;
  // treeitem & menuitem: expand is handled by click event (resolveClick + activateOnClick),
  // NOT by mousedown. mousedown only does focus+select for immediate visual feedback.
  // Without this guard, mousedown→expand + click→expand = double toggle = no change.
  if (role === "treeitem" || role === "menuitem") return false;
  return true;
}

export function resolveMouse(input: MouseInput): ResolveResult {
  const meta = {
    input: {
      type: "MOUSE",
      key: "mousedown",
      elementId: null as string | null,
    },
  };

  // Label redirect takes priority
  if (input.isLabel && input.labelTargetItemId && input.labelTargetGroupId) {
    meta.input.elementId = input.labelTargetItemId;
    return {
      commands: [
        OS_FOCUS({
          zoneId: input.labelTargetGroupId,
          itemId: input.labelTargetItemId,
        }) as any,
      ],
      meta,
      preventDefault: true,
      fallback: false,
    };
  }

  // No item but has zone → zone-activate (empty area click)
  if (!input.targetItemId && input.targetGroupId) {
    return {
      commands: [
        OS_FOCUS({ zoneId: input.targetGroupId, itemId: null }) as any,
      ],
      meta,
      preventDefault: false,
      fallback: false,
    };
  }

  // No target at all → ignore
  if (!input.targetItemId || !input.targetGroupId) {
    return { commands: [], meta: null, preventDefault: false, fallback: false };
  }

  meta.input.elementId = input.targetItemId;

  const commands = [];
  commands.push(
    OS_FOCUS({
      zoneId: input.targetGroupId,
      itemId: input.targetItemId,
      skipSelection: true,
    }) as any,
  );

  const selectMode = resolveSelectMode(input);
  commands.push(
    OS_SELECT({ targetId: input.targetItemId, mode: selectMode }) as any,
  );

  if (isClickExpandable(input.hasAriaExpanded, input.itemRole)) {
    commands.push(OS_ACTIVATE() as any);
  }

  const preventDefault = selectMode === "range" || selectMode === "toggle";

  return {
    commands,
    meta,
    preventDefault,
    fallback: false,
  };
}
