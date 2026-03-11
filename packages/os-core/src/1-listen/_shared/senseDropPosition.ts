/**
 * senseDropPosition — DOM → drop position for drag path.
 *
 * Reads item bounding rects from the DOM to determine
 * which item a drag is hovering over and whether it's
 * before or after the midpoint.
 */

// ═══════════════════════════════════════════════════════════════════
// Pure Interface: DropSenseInput
// ═══════════════════════════════════════════════════════════════════

export interface DropSenseInput {
  clientY: number;
  items: Array<{ itemId: string; top: number; bottom: number }>;
}

// ═══════════════════════════════════════════════════════════════════
// Extract: DropSenseInput → Drop result
// ═══════════════════════════════════════════════════════════════════

export function extractDropPosition(
  input: DropSenseInput,
): { overItemId: string; position: "before" | "after" } | null {
  for (const item of input.items) {
    if (input.clientY >= item.top && input.clientY <= item.bottom) {
      const mid = item.top + (item.bottom - item.top) / 2;
      return {
        overItemId: item.itemId,
        position: input.clientY < mid ? "before" : "after",
      };
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// DOM Adapter: reads DOM → DropSenseInput → extractDropPosition
// ═══════════════════════════════════════════════════════════════════

export function senseDropPosition(
  e: { clientY: number },
  zoneEl: HTMLElement,
): { overItemId: string; position: "before" | "after" } | null {
  const nodeList = zoneEl.querySelectorAll("[data-item]");
  const items: DropSenseInput["items"] = [];

  for (const node of nodeList) {
    if (node.closest("[data-zone]") !== zoneEl) continue;
    const rect = node.getBoundingClientRect();
    const itemId = (node as HTMLElement).id;
    if (!itemId) continue;
    items.push({ itemId, top: rect.top, bottom: rect.bottom });
  }

  return extractDropPosition({ clientY: e.clientY, items });
}
