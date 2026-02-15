/**
 * Android FocusFinder — 100% faithful port
 *
 * Source: platform/frameworks/base/core/java/android/view/FocusFinder.java
 * All function names, logic, and the magic constant 13 are preserved exactly.
 *
 * Operates purely on DOMRect objects. No DOM access, no side effects.
 */

export type FocusDirection = "up" | "down" | "left" | "right";

// ═══════════════════════════════════════════════════════════════════
// isCandidate — partial overlap allowed
// Checks whether dest is at least partially to the direction of source.
// ═══════════════════════════════════════════════════════════════════

function isCandidate(
  src: DOMRect,
  dest: DOMRect,
  direction: FocusDirection,
): boolean {
  switch (direction) {
    case "left":
      return (
        (src.right > dest.right || src.left >= dest.right) &&
        src.left > dest.left
      );
    case "right":
      return (
        (src.left < dest.left || src.right <= dest.left) &&
        src.right < dest.right
      );
    case "up":
      return (
        (src.bottom > dest.bottom || src.top >= dest.bottom) &&
        src.top > dest.top
      );
    case "down":
      return (
        (src.top < dest.top || src.bottom <= dest.top) &&
        src.bottom < dest.bottom
      );
  }
}

// ═══════════════════════════════════════════════════════════════════
// beamsOverlap — do the "beams" w.r.t. the direction's axis overlap?
// ═══════════════════════════════════════════════════════════════════

function beamsOverlap(
  direction: FocusDirection,
  rect1: DOMRect,
  rect2: DOMRect,
): boolean {
  switch (direction) {
    case "left":
    case "right":
      // Vertical axis overlap
      return rect2.bottom > rect1.top && rect2.top < rect1.bottom;
    case "up":
    case "down":
      // Horizontal axis overlap
      return rect2.right > rect1.left && rect2.left < rect1.right;
  }
}

// ═══════════════════════════════════════════════════════════════════
// isToDirectionOf — e.g. for left, is "to left of"
// ═══════════════════════════════════════════════════════════════════

function isToDirectionOf(
  direction: FocusDirection,
  src: DOMRect,
  dest: DOMRect,
): boolean {
  switch (direction) {
    case "left":
      return src.left >= dest.right;
    case "right":
      return src.right <= dest.left;
    case "up":
      return src.top >= dest.bottom;
    case "down":
      return src.bottom <= dest.top;
  }
}

// ═══════════════════════════════════════════════════════════════════
// majorAxisDistance — edge-to-near-edge along the direction axis
// ═══════════════════════════════════════════════════════════════════

function majorAxisDistance(
  direction: FocusDirection,
  source: DOMRect,
  dest: DOMRect,
): number {
  return Math.max(0, majorAxisDistanceRaw(direction, source, dest));
}

function majorAxisDistanceRaw(
  direction: FocusDirection,
  source: DOMRect,
  dest: DOMRect,
): number {
  switch (direction) {
    case "left":
      return source.left - dest.right;
    case "right":
      return dest.left - source.right;
    case "up":
      return source.top - dest.bottom;
    case "down":
      return dest.top - source.bottom;
  }
}

// ═══════════════════════════════════════════════════════════════════
// majorAxisDistanceToFarEdge — edge-to-far-edge along direction
// ═══════════════════════════════════════════════════════════════════

function majorAxisDistanceToFarEdge(
  direction: FocusDirection,
  source: DOMRect,
  dest: DOMRect,
): number {
  return Math.max(1, majorAxisDistanceToFarEdgeRaw(direction, source, dest));
}

function majorAxisDistanceToFarEdgeRaw(
  direction: FocusDirection,
  source: DOMRect,
  dest: DOMRect,
): number {
  switch (direction) {
    case "left":
      return source.left - dest.left;
    case "right":
      return dest.right - source.right;
    case "up":
      return source.top - dest.top;
    case "down":
      return dest.bottom - source.bottom;
  }
}

// ═══════════════════════════════════════════════════════════════════
// minorAxisDistance — center-to-center on the perpendicular axis
// ═══════════════════════════════════════════════════════════════════

function minorAxisDistance(
  direction: FocusDirection,
  source: DOMRect,
  dest: DOMRect,
): number {
  switch (direction) {
    case "left":
    case "right":
      // Vertical center-to-center
      return Math.abs(
        source.top + source.height / 2 - (dest.top + dest.height / 2),
      );
    case "up":
    case "down":
      // Horizontal center-to-center
      return Math.abs(
        source.left + source.width / 2 - (dest.left + dest.width / 2),
      );
  }
}

// ═══════════════════════════════════════════════════════════════════
// getWeightedDistanceFor — the famous "fudge-factor"
// "Warning: this fudge factor is finely tuned, be sure to run
//  all focus tests if you dare tweak it."
// ═══════════════════════════════════════════════════════════════════

function getWeightedDistanceFor(major: number, minor: number): number {
  return 13 * major * major + minor * minor;
}

// ═══════════════════════════════════════════════════════════════════
// beamBeats — one rect may be a better candidate by virtue of
// being exclusively in the beam of the source rect
// ═══════════════════════════════════════════════════════════════════

function beamBeats(
  direction: FocusDirection,
  source: DOMRect,
  rect1: DOMRect,
  rect2: DOMRect,
): boolean {
  const rect1InSrcBeam = beamsOverlap(direction, source, rect1);
  const rect2InSrcBeam = beamsOverlap(direction, source, rect2);

  // If rect1 isn't exclusively in the src beam, it doesn't win
  if (rect2InSrcBeam || !rect1InSrcBeam) {
    return false;
  }

  // We know rect1 is in the beam, and rect2 is not

  // If rect1 is to the direction of, and rect2 is not, rect1 wins
  if (!isToDirectionOf(direction, source, rect2)) {
    return true;
  }

  // For horizontal directions, being exclusively in beam always wins
  if (direction === "left" || direction === "right") {
    return true;
  }

  // For vertical directions, beams only beat up to a point:
  // as long as rect2 isn't completely closer, rect1 wins
  return (
    majorAxisDistance(direction, source, rect1) <
    majorAxisDistanceToFarEdge(direction, source, rect2)
  );
}

// ═══════════════════════════════════════════════════════════════════
// isBetterCandidate — THE core routine that determines focus order
// ═══════════════════════════════════════════════════════════════════

function isBetterCandidate(
  direction: FocusDirection,
  source: DOMRect,
  rect1: DOMRect,
  rect2: DOMRect,
): boolean {
  // To be a better candidate, need to at least be a candidate
  if (!isCandidate(source, rect1, direction)) {
    return false;
  }

  // If rect2 is not a candidate, rect1 is better
  if (!isCandidate(source, rect2, direction)) {
    return true;
  }

  // If rect1 is better by beam, it wins
  if (beamBeats(direction, source, rect1, rect2)) {
    return true;
  }

  // If rect2 is better by beam, rect1 can't be
  if (beamBeats(direction, source, rect2, rect1)) {
    return false;
  }

  // Otherwise, do fudge-tastic comparison of major and minor axis
  return (
    getWeightedDistanceFor(
      majorAxisDistance(direction, source, rect1),
      minorAxisDistance(direction, source, rect1),
    ) <
    getWeightedDistanceFor(
      majorAxisDistance(direction, source, rect2),
      minorAxisDistance(direction, source, rect2),
    )
  );
}

// ═══════════════════════════════════════════════════════════════════
// findNextFocus — main entry point (operates on rects)
// ═══════════════════════════════════════════════════════════════════

export interface FocusCandidate {
  id: string;
  rect: DOMRect;
}

/**
 * Find the best candidate from a list, exactly as Android does.
 *
 * Initializes bestCandidateRect to an "impossible" position
 * (offset beyond source in the opposite direction),
 * then iterates all focusables comparing with isBetterCandidate.
 */
export function findBestCandidate(
  source: DOMRect,
  direction: FocusDirection,
  candidates: FocusCandidate[],
  excludeId?: string,
): FocusCandidate | null {
  // Initialize best candidate rect to something impossible
  // (so the first plausible view will become the best choice)
  let bestRect = new DOMRect(source.x, source.y, source.width, source.height);

  switch (direction) {
    case "left":
      bestRect = offsetRect(bestRect, source.width + 1, 0);
      break;
    case "right":
      bestRect = offsetRect(bestRect, -(source.width + 1), 0);
      break;
    case "up":
      bestRect = offsetRect(bestRect, 0, source.height + 1);
      break;
    case "down":
      bestRect = offsetRect(bestRect, 0, -(source.height + 1));
      break;
  }

  let best: FocusCandidate | null = null;

  for (const candidate of candidates) {
    if (candidate.id === excludeId) continue;

    if (isBetterCandidate(direction, source, candidate.rect, bestRect)) {
      bestRect = candidate.rect;
      best = candidate;
    }
  }

  return best;
}

// ═══════════════════════════════════════════════════════════════════
// Utility
// ═══════════════════════════════════════════════════════════════════

function offsetRect(rect: DOMRect, dx: number, dy: number): DOMRect {
  return new DOMRect(rect.x + dx, rect.y + dy, rect.width, rect.height);
}
