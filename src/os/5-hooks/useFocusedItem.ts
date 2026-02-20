/**
 * useFocusedItem — OS hook to read the focused item in a zone.
 *
 * Encapsulates OS internal state path so apps don't need to know
 * `s.os.focus.zones[zoneId]?.lastFocusedId`.
 */

import { os } from "@/os/kernel";

export function useFocusedItem(zoneId: string): string | null {
    return os.useComputed(
        (s) => s.os.focus.zones[zoneId]?.lastFocusedId ?? null,
    );
}
