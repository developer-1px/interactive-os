/**
 * ZoneRegistry — Runtime registry for mounted Zones.
 *
 * Maps zone IDs to their config + DOM element reference.
 * Context providers use this to resolve zone-specific data.
 *
 * Lifecycle:
 *   Zone mount  → ZoneRegistry.register(id, config, element)
 *   Zone unmount → ZoneRegistry.unregister(id)
 */

import type { ZoneRole } from "../registry/roleRegistry";
import type { FocusGroupConfig } from "../schema/focus/config/FocusGroupConfig";
import type { AnyCommand } from "@kernel";

export interface ZoneEntry {
  config: FocusGroupConfig;
  element: HTMLElement;
  role?: ZoneRole;
  parentId: string | null;
  /** Command dispatched on ESC when dismiss.escape is "close" */
  onDismiss?: AnyCommand;
}

const registry = new Map<string, ZoneEntry>();

export const ZoneRegistry = {
  register(id: string, entry: ZoneEntry): void {
    registry.set(id, entry);
  },

  unregister(id: string): void {
    registry.delete(id);
  },

  get(id: string): ZoneEntry | undefined {
    return registry.get(id);
  },

  has(id: string): boolean {
    return registry.has(id);
  },

  /** Get all registered zone IDs */
  keys(): IterableIterator<string> {
    return registry.keys();
  },
};
