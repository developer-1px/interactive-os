/**
 * resolveZoneSpatial - Calculate next zone for seamless arrow navigation
 *
 * Pipeline Phase 3: UPDATE
 * Pure function - no side effects, no state mutations.
 * Returns the resolved target zone and item based on spatial positioning.
 *
 * Uses Android FocusFinder algorithm for zone selection:
 * - isCandidate: partial overlap allowed
 * - beamBeats: beam-aligned zones preferred
 * - getWeightedDistanceFor: 13 * major² + minor² scoring
 */

import {
  findBestCandidate,
  type FocusCandidate,
  type FocusDirection,
} from "./focusFinder";

export interface ZoneSpatialContext {
  /** Get rect for a specific item */
  getItemRect: (itemId: string) => DOMRect | undefined;
  /** Get rect for a specific group */
  getGroupRect: (groupId: string) => DOMRect | undefined;
  /** Get all group rects */
  getAllGroupRects: () => Map<string, DOMRect>;
  /** Get zone entry by ID */
  getGroupEntry: (id: string) =>
    | {
      store: any;
    }
    | undefined;
  /** Get DOM-based items for a zone */
  getGroupItems: (id: string) => string[];
  /** Get parent zone ID (for hierarchy-aware navigation) */
  getGroupParentId: (id: string) => string | null;
}

export interface ZoneSpatialResult {
  /** Target zone ID */
  targetGroupId: string;
  /** Target item ID within the zone */
  targetItemId: string | null;
  /** The store to commit changes to */
  targetStore: any;
}

/**
 * Calculate the next zone and entry item based on spatial positioning.
 * Uses Android FocusFinder for both zone selection and item entry.
 *
 * Hierarchy-aware: prefers child zones → sibling zones → any zone.
 */
export function resolveZoneSpatial(
  currentGroupId: string,
  direction: FocusDirection,
  currentItemId: string | null,
  context: ZoneSpatialContext,
): ZoneSpatialResult | null {
  // 1. Get current position (item or zone)
  const currentRect = currentItemId
    ? context.getItemRect(currentItemId)
    : context.getGroupRect(currentGroupId);

  if (!currentRect) return null;

  // 2. Get current zone's parent for hierarchy filtering
  const currentParentId = context.getGroupParentId(currentGroupId);

  // 3. Get all zone rects and build candidate lists by hierarchy
  const allGroupRects = context.getAllGroupRects();

  const childCandidates: FocusCandidate[] = [];
  const siblingCandidates: FocusCandidate[] = [];
  const allCandidates: FocusCandidate[] = [];

  for (const [groupId, rect] of allGroupRects) {
    if (groupId === currentGroupId) continue;

    const candidate: FocusCandidate = { id: groupId, rect };
    allCandidates.push(candidate);

    // Hierarchy classification
    const candidateParentId = context.getGroupParentId(groupId);
    if (candidateParentId === currentGroupId) {
      childCandidates.push(candidate);
    } else if (candidateParentId === currentParentId) {
      siblingCandidates.push(candidate);
    }
  }

  if (allCandidates.length === 0) return null;

  // 4. Hierarchy-aware selection: children → siblings → all
  //    Use Android FocusFinder at each level, try narrowest scope first
  let bestZone: FocusCandidate | null = null;

  if (childCandidates.length > 0) {
    bestZone = findBestCandidate(currentRect, direction, childCandidates);
  }
  if (!bestZone && siblingCandidates.length > 0) {
    bestZone = findBestCandidate(currentRect, direction, siblingCandidates);
  }
  if (!bestZone) {
    bestZone = findBestCandidate(currentRect, direction, allCandidates);
  }

  if (!bestZone) return null;

  // 5. Resolve target entry
  const targetGroupId = bestZone.id;
  const targetEntry = context.getGroupEntry(targetGroupId);
  if (!targetEntry?.store) return null;

  const targetStore = targetEntry.store;
  const targetItems = context.getGroupItems(targetGroupId);

  // 6. Empty zone
  if (targetItems.length === 0) {
    return { targetGroupId, targetItemId: null, targetStore };
  }

  // 7. Find closest item in target zone using Android FocusFinder
  const itemCandidates: FocusCandidate[] = [];
  for (const itemId of targetItems) {
    const itemRect = context.getItemRect(itemId);
    if (!itemRect) continue;
    itemCandidates.push({ id: itemId, rect: itemRect });
  }

  if (itemCandidates.length === 0) {
    return { targetGroupId, targetItemId: targetItems[0], targetStore };
  }

  const bestItem = findBestCandidate(
    currentRect,
    direction,
    itemCandidates,
  );

  return {
    targetGroupId,
    targetItemId: bestItem?.id ?? targetItems[0],
    targetStore,
  };
}

