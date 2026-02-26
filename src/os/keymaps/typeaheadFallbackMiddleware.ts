/**
 * typeaheadFallbackMiddleware — OS-level typeahead navigation.
 *
 * When KeyboardListener misses (no keybinding for a single character key),
 * this middleware checks if the active zone has typeahead enabled.
 * If so, it reads DOM item labels (textContent) and resolves which item
 * to focus via resolveTypeahead.
 *
 * W3C APG: "Type a character: focus moves to the next item with a name
 * that starts with the typed character."
 *
 * Label source: el.textContent (accessible name fallback per ARIA spec)
 */

import type { BaseCommand, Middleware } from "@kernel";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OS_FOCUS } from "@os/3-commands/focus/focus";
import { resolveTypeahead } from "@os/3-commands/navigate/typeahead";
import { os } from "@os/kernel";
import { isEditingElement } from "@os/keymaps/fieldKeyOwnership";

/**
 * Get ordered item IDs and their labels from DOM for a zone element.
 */
function getItemsAndLabels(zoneEl: HTMLElement): {
  items: string[];
  labels: Map<string, string>;
} {
  const itemEls = zoneEl.querySelectorAll<HTMLElement>("[data-item-id]");
  const items: string[] = [];
  const labels = new Map<string, string>();

  for (const el of itemEls) {
    const id = el.dataset["itemId"];
    if (!id) continue;
    items.push(id);
    const label = el.getAttribute("aria-label") || el.textContent || "";
    labels.set(id, label.trim());
  }

  return { items, labels };
}

export const typeaheadFallbackMiddleware: Middleware = {
  id: "typeahead",
  fallback: (event: Event): BaseCommand | null => {
    if (!(event instanceof KeyboardEvent)) return null;

    // Never typeahead during IME composition (Korean, Japanese, Chinese)
    if (event.isComposing || event.keyCode === 229) return null;

    // Never typeahead while editing a field (contentEditable, input, textarea)
    const target = event.target as HTMLElement;
    if (target?.isContentEditable || isEditingElement(target)) return null;

    // Only single printable characters (no modifiers except Shift)
    if (event.key.length !== 1) return null;
    if (event.metaKey || event.ctrlKey || event.altKey) return null;

    // Ignore Space (handled by check override)
    if (event.key === " ") return null;

    // Get active zone
    const osState = os.getState().os?.focus;
    if (!osState?.activeZoneId) return null;

    const zoneId = osState.activeZoneId;
    const entry = ZoneRegistry.get(zoneId);
    if (!entry) return null;

    // Check if typeahead is enabled for this zone
    if (!entry.config.navigate.typeahead) return null;

    // Get current focused item
    const zone = osState.zones?.[zoneId];
    const currentId = zone?.focusedItemId ?? null;

    // Read items and labels — push model first, DOM fallback
    let items: string[];
    let labels: Map<string, string>;

    if (entry.getLabels) {
      // Push model: headless-compatible
      labels = entry.getLabels();
      items = entry.getItems?.() ?? [...labels.keys()];
    } else if (entry.element) {
      // DOM fallback: browser-only
      const result = getItemsAndLabels(entry.element);
      items = result.items;
      labels = result.labels;
    } else {
      return null;
    }
    if (items.length === 0) return null;

    // Resolve typeahead
    const targetId = resolveTypeahead(currentId, event.key, items, labels);
    if (!targetId || targetId === currentId) return null;

    return OS_FOCUS({ zoneId, itemId: targetId }) as BaseCommand;
  },
};
