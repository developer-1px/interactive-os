/**
 * seedAriaState — Derive initial ARIA item state from Zone config.
 *
 * Pure function: (config, itemIds) → { [itemId]: { "aria-*": false, ... } }
 *
 * Called at Zone creation time (OS_ZONE_INIT) to ensure all items
 * have the correct aria-* keys from mount. computeItem then
 * projects whatever is in items[id] — no config scanning needed.
 */

import type { FocusGroupConfig } from "@os-core/schema/types/focus/config/FocusGroupConfig";

export interface AriaSeed {
  "aria-selected"?: boolean;
  "aria-checked"?: boolean;
  "aria-pressed"?: boolean;
  "aria-expanded"?: boolean;
}

/**
 * Derive which aria-* keys this Zone projects, based on config.
 *
 * Rules:
 *   - select.mode !== "none" → aria-selected
 *   - expand.mode !== "none" → aria-expanded
 *   - inputmap contains OS_CHECK → aria-checked
 *   - inputmap contains OS_PRESS → aria-pressed
 */
export function deriveAriaKeys(config: FocusGroupConfig): (keyof AriaSeed)[] {
  const keys: (keyof AriaSeed)[] = [];

  if (config.select?.mode && config.select.mode !== "none") {
    keys.push("aria-selected");
  }

  if (config.expand?.mode && config.expand.mode !== "none") {
    keys.push("aria-expanded");
  }

  // Scan inputmap for OS_CHECK / OS_PRESS commands
  const inputmap = config.inputmap;
  if (inputmap) {
    for (const cmds of Object.values(inputmap)) {
      for (const cmd of cmds) {
        if (cmd.type === "OS_CHECK" && !keys.includes("aria-checked")) {
          keys.push("aria-checked");
        }
        if (cmd.type === "OS_PRESS" && !keys.includes("aria-pressed")) {
          keys.push("aria-pressed");
        }
      }
    }
  }

  return keys;
}

/**
 * Build initial items map with aria-* keys set to false.
 *
 * @param config - Zone's resolved FocusGroupConfig
 * @param itemIds - Ordered item IDs in this zone
 * @returns items map ready to merge into ZoneState.items
 */
export function seedAriaState(
  config: FocusGroupConfig,
  itemIds: string[],
): Record<string, AriaSeed> {
  const ariaKeys = deriveAriaKeys(config);
  if (ariaKeys.length === 0) return {};

  const template: AriaSeed = {};
  for (const key of ariaKeys) {
    template[key] = false;
  }

  const items: Record<string, AriaSeed> = {};
  for (const id of itemIds) {
    items[id] = { ...template };
  }
  return items;
}
