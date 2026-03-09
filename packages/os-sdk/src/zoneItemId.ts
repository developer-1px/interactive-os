/**
 * zoneItemId — namespace an item ID by zone to prevent cross-zone collisions.
 *
 * When the same domain object (e.g., a doc path) appears in multiple zones,
 * DOM `id` attributes would collide. This helper prefixes with the zone ID.
 *
 * @example
 *   zoneItemId("docs-reader", "inbox/readme.md")
 *   // → "docs-reader/inbox/readme.md"
 */
export function zoneItemId(zoneId: string, rawId: string): string {
  return `${zoneId}/${rawId}`;
}
