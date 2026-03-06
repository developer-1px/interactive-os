/**
 * OverlayContext — Shared context between Portal, Popover, and Dismiss.
 */

import { createContext, useContext } from "react";

interface OverlayContextValue {
    overlayId: string;
}

export const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useOverlayContext() {
    return useContext(OverlayContext);
}
