/**
 * SELECT Command - Space key selection
 */

import type {
  OSCommand,
  OSContext,
  OSResult,
} from "@os/features/focus/pipeline/core/osCommand.ts";

// ═══════════════════════════════════════════════════════════════════
// Selection Mode Handlers
// ═══════════════════════════════════════════════════════════════════

function handleSingleSelect(targetId: string): {
  selection: string[];
  anchor: string;
} {
  return {
    selection: [targetId],
    anchor: targetId,
  };
}

function handleToggleSelect(
  ctx: OSContext,
  targetId: string,
): { selection: string[]; anchor: string | null } {
  if (ctx.selection.includes(targetId)) {
    return {
      selection: ctx.selection.filter((id) => id !== targetId),
      anchor: ctx.selectionAnchor,
    };
  }
  return {
    selection: [...ctx.selection, targetId],
    anchor: targetId,
  };
}

function handleRangeSelect(
  ctx: OSContext,
  targetId: string,
): { selection: string[]; anchor: string | null } {
  if (!ctx.selectionAnchor) {
    return { selection: [targetId], anchor: targetId };
  }

  const items = ctx.dom.items;
  const anchorIdx = items.indexOf(ctx.selectionAnchor);
  const targetIdx = items.indexOf(targetId);
  const [start, end] =
    anchorIdx < targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];

  return {
    selection: items.slice(start, end + 1),
    anchor: ctx.selectionAnchor,
  };
}

// ═══════════════════════════════════════════════════════════════════
// SELECT Command
// ═══════════════════════════════════════════════════════════════════

export const SELECT: OSCommand<{
  targetId?: string;
  mode?: "single" | "replace" | "toggle" | "range";
  zoneId?: string;
}> = {
  run: (ctx, payload) => {
    const targetId = payload?.targetId ?? ctx.focusedItemId;
    if (!targetId) return null;

    const mode = payload?.mode ?? "single";
    let selectionResult: { selection: string[]; anchor: string | null };

    switch (mode) {
      case "single":
      case "replace": // Alias for single
        selectionResult = handleSingleSelect(targetId);
        break;
      case "range":
        selectionResult = handleRangeSelect(ctx, targetId);
        break;
      case "toggle":
        selectionResult = handleToggleSelect(ctx, targetId);
        break;
    }

    const result: OSResult = {
      state: {
        selection: selectionResult.selection,
        selectionAnchor: selectionResult.anchor,
      },
    };

    if (ctx.selectCommand) {
      result.dispatch = ctx.selectCommand;
    }

    return result;
  },
};
