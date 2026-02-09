/**
 * resolveEntry - Zone Entry Logic
 *
 * Determines which item to focus when entering a zone.
 */

import type { NavigateConfig } from "../../schema";

export function resolveEntry(
  items: string[],
  config: NavigateConfig,
  context?: {
    lastFocusedId?: string | null;
    selection?: string[];
  },
): string | null {
  if (items.length === 0) return null;

  switch (config.entry) {
    case "first":
      return items[0];

    case "last":
      return items[items.length - 1];

    case "restore":
      // Try last focused, fail over to selection, then first
      if (context?.lastFocusedId && items.includes(context.lastFocusedId)) {
        return context.lastFocusedId;
      }
      if (context?.selection && context.selection.length > 0) {
        const selected = context.selection.find((id) => items.includes(id));
        if (selected) return selected;
      }
      return items[0];

    case "selected":
      // Try selection, fail over to last focused, then first
      if (context?.selection && context.selection.length > 0) {
        const selected = context.selection.find((id) => items.includes(id));
        if (selected) return selected;
      }
      if (context?.lastFocusedId && items.includes(context.lastFocusedId)) {
        return context.lastFocusedId;
      }
      return items[0];

    default:
      return items[0];
  }
}
