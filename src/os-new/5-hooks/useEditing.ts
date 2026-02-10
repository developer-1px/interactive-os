/**
 * useEditing — Is this item currently in editing mode?
 */

import { kernel } from "../kernel";

export function useEditing(zoneId: string, itemId: string): boolean {
    return kernel.useComputed(
        (s) => s.os.focus.zones[zoneId]?.editingItemId === itemId,
    );
}
