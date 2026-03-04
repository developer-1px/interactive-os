/**
 * State Readers — pure kernel state accessors.
 *
 * Extracted from compute.ts. These read OS state without computing attrs.
 * Used by headless tests, simulate.ts, and page.ts.
 */

import type { HeadlessKernel } from "./headless.types";

export function readActiveZoneId(kernel: HeadlessKernel): string | null {
    return kernel.getState().os.focus.activeZoneId;
}

export function readZone(kernel: HeadlessKernel, zoneId?: string) {
    const id = zoneId ?? readActiveZoneId(kernel);
    return id ? kernel.getState().os.focus.zones[id] : undefined;
}

export function readFocusedItemId(
    kernel: HeadlessKernel,
    zoneId?: string,
): string | null {
    return readZone(kernel, zoneId)?.focusedItemId ?? null;
}

export function readSelected(
    kernel: HeadlessKernel,
    itemId: string,
    zoneId?: string,
): boolean {
    return readZone(kernel, zoneId)?.items[itemId]?.["aria-selected"] ?? false;
}
