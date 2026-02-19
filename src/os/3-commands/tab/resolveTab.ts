/**
 * resolveTab — Pure tab navigation resolver.
 *
 * Extracts the core tab navigation logic into testable pure functions.
 * The TAB command delegates to these resolvers.
 */

export type TabDirection = "forward" | "backward";
export type TabBehavior = "trap" | "flow" | "escape";

export interface ZoneOrderEntry {
  zoneId: string;
  firstItemId: string | null;
  lastItemId: string | null;
  entry: "first" | "last" | "restore" | "selected";
  selectedItemId: string | null;
  lastFocusedId: string | null;
}

/**
 * Resolve the next focus target within the current zone (trap/flow).
 * Returns the target item ID, or null if at boundary (flow mode exits zone).
 */
export function resolveTabWithinZone(
  currentItemId: string | null,
  items: string[],
  direction: TabDirection,
  loop: boolean,
): string | null {
  if (items.length === 0) return null;

  const currentIndex = currentItemId ? items.indexOf(currentItemId) : -1;
  const delta = direction === "forward" ? 1 : -1;
  let nextIndex = currentIndex + delta;

  if (loop) {
    if (nextIndex < 0) nextIndex = items.length - 1;
    else if (nextIndex >= items.length) nextIndex = 0;
  } else if (nextIndex < 0 || nextIndex >= items.length) {
    return null; // at boundary
  }

  return items[nextIndex] ?? null;
}

/**
 * Resolve the next zone to escape to (escape/flow-at-boundary).
 * Returns { zoneId, itemId } or null if no next zone.
 */
export function resolveTabEscapeZone(
  currentZoneId: string,
  zoneOrder: ZoneOrderEntry[],
  direction: TabDirection,
): { zoneId: string; itemId: string } | null {
  const currentIdx = zoneOrder.findIndex((z) => z.zoneId === currentZoneId);
  if (currentIdx === -1) return null;
  if (zoneOrder.length <= 1) return null;

  const delta = direction === "forward" ? 1 : -1;

  // Try each successive zone, skipping empty ones (e.g., parent container zones)
  for (let step = 1; step < zoneOrder.length; step++) {
    const candidateIdx =
      ((currentIdx + delta * step) % zoneOrder.length + zoneOrder.length) %
      zoneOrder.length;

    const nextZone = zoneOrder[candidateIdx]!;

    // APG Tab Recovery: target depends on navigate.entry config
    let targetId: string | null = null;
    switch (nextZone.entry) {
      case "selected":
        targetId = nextZone.selectedItemId ?? nextZone.firstItemId;
        break;
      case "restore":
        targetId = nextZone.lastFocusedId ?? nextZone.firstItemId;
        break;
      case "last":
        targetId = nextZone.lastItemId;
        break;
      case "first":
      default:
        targetId =
          direction === "forward" ? nextZone.firstItemId : nextZone.lastItemId;
        break;
    }

    if (targetId) {
      return { zoneId: nextZone.zoneId, itemId: targetId };
    }
    // targetId is null → zone has no items, skip to next
  }

  return null;
}

/**
 * Top-level tab resolution: combines within-zone and cross-zone logic.
 */
export function resolveTab(
  currentItemId: string | null,
  items: string[],
  behavior: TabBehavior,
  direction: TabDirection,
  currentZoneId: string,
  zoneOrder: ZoneOrderEntry[],
):
  | { type: "within"; itemId: string }
  | { type: "escape"; zoneId: string; itemId: string }
  | null {
  if (items.length === 0) return null;

  // ─── trap: cycle within zone ───
  if (behavior === "trap") {
    const target = resolveTabWithinZone(currentItemId, items, direction, true);
    if (target) return { type: "within", itemId: target };
    return null;
  }

  // ─── flow: navigate within zone, escape at boundary ───
  if (behavior === "flow") {
    const target = resolveTabWithinZone(currentItemId, items, direction, false);
    if (target) return { type: "within", itemId: target };
    // Boundary reached → escape
    const escapeTarget = resolveTabEscapeZone(
      currentZoneId,
      zoneOrder,
      direction,
    );
    if (escapeTarget) return { type: "escape", ...escapeTarget };
    return null;
  }

  // ─── escape: move to next/prev zone immediately ───
  const escapeTarget = resolveTabEscapeZone(
    currentZoneId,
    zoneOrder,
    direction,
  );
  if (escapeTarget) return { type: "escape", ...escapeTarget };
  return null;
}
