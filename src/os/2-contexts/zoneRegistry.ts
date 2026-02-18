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

import type { BaseCommand } from "@kernel";
import type { ZoneRole } from "../registries/roleRegistry";
import type { FocusGroupConfig } from "../schemas/focus/config/FocusGroupConfig";

export interface ZoneEntry {
  config: FocusGroupConfig;
  element: HTMLElement;
  role?: ZoneRole;
  parentId: string | null;
  /** Command dispatched on ESC when dismiss.escape is "close" */
  onDismiss?: BaseCommand;
  // Command bindings (Zone-level delegation)
  onAction?: BaseCommand;
  onSelect?: BaseCommand;
  onCheck?: BaseCommand;
  onDelete?: BaseCommand;
  onMoveUp?: BaseCommand;
  onMoveDown?: BaseCommand;
  onCopy?: BaseCommand;
  onCut?: BaseCommand;
  onPaste?: BaseCommand;
  onUndo?: BaseCommand;
  onRedo?: BaseCommand;
}

const registry = new Map<string, ZoneEntry>();
const disabledItems = new Map<string, Set<string>>();

export const ZoneRegistry = {
  register(id: string, entry: ZoneEntry): void {
    registry.set(id, entry);
  },

  unregister(id: string): void {
    registry.delete(id);
    disabledItems.delete(id);
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

  // ─── Per-item disabled state (declaration, not action) ───

  setDisabled(zoneId: string, itemId: string, disabled: boolean): void {
    if (disabled) {
      let set = disabledItems.get(zoneId);
      if (!set) {
        set = new Set();
        disabledItems.set(zoneId, set);
      }
      set.add(itemId);
    } else {
      disabledItems.get(zoneId)?.delete(itemId);
    }
  },

  isDisabled(zoneId: string, itemId: string): boolean {
    return disabledItems.get(zoneId)?.has(itemId) ?? false;
  },

  getDisabledItems(zoneId: string): Set<string> {
    return disabledItems.get(zoneId) ?? EMPTY_SET;
  },
};

const EMPTY_SET: ReadonlySet<string> = new Set();
