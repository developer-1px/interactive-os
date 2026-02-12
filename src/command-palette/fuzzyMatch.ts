/**
 * Fuzzy Match — fzf/fzy-inspired matching with advanced scoring.
 *
 * Scoring strategy:
 *   +10  word boundary match (after /, -, _, ., space, or camelCase)
 *   +5   consecutive match bonus
 *   +3   prefix match (query starts at target start)
 *   +1   exact case match
 *   +1   base match
 *   -0.5 gap between matches (distance penalty)
 *   -0.1 target length penalty (shorter = more specific)
 *   +100 exact match bonus
 *
 * Returns null if query doesn't subsequence-match target.
 */

export interface FuzzyMatchResult {
  score: number;
  matchedIndices: number[];
}

/**
 * Check if a character is a word boundary position.
 * Recognizes: separators (/ - _ . space) and camelCase transitions.
 */
function isWordBoundary(target: string, i: number): boolean {
  if (i === 0) return true;

  const prev = target[i - 1]!;
  const curr = target[i]!;

  // After separator
  if ("/- _.".includes(prev)) return true;

  // camelCase: lowercase → uppercase (e.g. "useRouteList" → R, L)
  if (
    prev === prev.toLowerCase() &&
    curr === curr.toUpperCase() &&
    curr !== curr.toLowerCase()
  ) {
    return true;
  }

  return false;
}

export function fuzzyMatch(
  query: string,
  target: string,
): FuzzyMatchResult | null {
  if (!query) return { score: 0, matchedIndices: [] };

  // Exact match — highest possible score
  if (query === target) {
    return {
      score: 100 + target.length,
      matchedIndices: Array.from({ length: target.length }, (_, i) => i),
    };
  }

  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  const matchedIndices: number[] = [];

  let queryIdx = 0;
  let score = 0;
  let lastMatchIdx = -1;

  for (let i = 0; i < targetLower.length && queryIdx < queryLower.length; i++) {
    if (targetLower[i] === queryLower[queryIdx]) {
      matchedIndices.push(i);

      // ── Consecutive match bonus ──
      if (lastMatchIdx === i - 1) {
        score += 5;
      } else if (lastMatchIdx >= 0) {
        // ── Gap penalty ── distance between matches
        const gap = i - lastMatchIdx - 1;
        score -= gap * 0.5;
      }

      // ── Word boundary bonus ──
      if (isWordBoundary(target, i)) {
        score += 10;
      }

      // ── Prefix bonus ── first char matches first char of target
      if (queryIdx === 0 && i === 0) {
        score += 3;
      }

      // ── Exact case match bonus ──
      if (target[i] === query[queryIdx]) {
        score += 1;
      }

      score += 1; // base match score
      lastMatchIdx = i;
      queryIdx++;
    }
  }

  // All query characters must match
  if (queryIdx !== queryLower.length) return null;

  // Shorter targets rank higher (more specific match)
  score -= target.length * 0.1;

  return { score, matchedIndices };
}
