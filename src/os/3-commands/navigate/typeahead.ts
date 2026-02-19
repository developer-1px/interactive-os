/**
 * Typeahead — Character-based focus navigation.
 *
 * W3C APG: "Type a character: focus moves to the next item with a name
 * that starts with the typed character."
 *
 * Behavior:
 * - Single character → jump to next matching item
 * - Same character repeated → cycle through matches
 * - Rapid characters (<500ms) → build prefix ("bl" → "Blueberry")
 * - After timeout → buffer resets
 *
 * This is a pure function with minimal state (buffer + timer).
 * The NAVIGATE command integrates it when config.typeahead === true.
 */

// ═══════════════════════════════════════════════════════════════════
// Buffer State
// ═══════════════════════════════════════════════════════════════════

let buffer = "";
let timer: ReturnType<typeof setTimeout> | null = null;
const TIMEOUT = 500;

export function resetTypeaheadBuffer(): void {
  buffer = "";
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Resolver
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve typeahead navigation.
 *
 * @param currentId - Currently focused item ID (null if none)
 * @param char - The character typed (single key)
 * @param items - Ordered list of item IDs
 * @param labels - Map of item ID → display label
 * @returns Target item ID, or null if no match
 */
export function resolveTypeahead(
  currentId: string | null,
  char: string,
  items: string[],
  labels: Map<string, string>,
): string | null {
  if (items.length === 0) return null;

  // Ignore non-printable / special keys
  if (char.length !== 1 || char === " ") return null;

  // Reset timer
  if (timer) clearTimeout(timer);
  timer = setTimeout(resetTypeaheadBuffer, TIMEOUT);

  const lowerChar = char.toLowerCase();

  // Same-character cycling: if buffer is a single repeated character
  // and the new char matches, cycle through items starting with that character
  const isSameChar = buffer.length === 1 && buffer[0] === lowerChar;

  if (isSameChar) {
    // Find all items starting with this character
    const matches = items.filter((id) =>
      labels.get(id)?.toLowerCase().startsWith(lowerChar),
    );
    if (matches.length === 0) return null;

    // Find current index in matches
    const currentIdx = currentId ? matches.indexOf(currentId) : -1;
    const nextIdx = (currentIdx + 1) % matches.length;
    return matches[nextIdx] ?? null;
  }

  // Append to buffer (multi-character prefix)
  buffer += lowerChar;

  // Find first item whose label starts with the buffer prefix
  // Start searching after current item for wrap-around
  const currentIdx = currentId ? items.indexOf(currentId) : -1;

  // Search from after current to end, then from start to current
  for (let i = 0; i < items.length; i++) {
    const idx = (currentIdx + 1 + i) % items.length;
    const id = items[idx]!;
    const label = labels.get(id);
    if (label?.toLowerCase().startsWith(buffer)) {
      return id;
    }
  }

  return null;
}
