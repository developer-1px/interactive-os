/**
 * Zone - Facade for FocusZone
 * 
 * Simple re-export that provides FocusContext for legacy consumers.
 * All focus behavior is delegated to FocusZone.
 */

import { useContext, useMemo, createContext } from "react";
import { FocusContext } from "@os/features/command/ui/CommandContext";
import { FocusZone, type FocusZoneProps } from "@os/features/focusZone/primitives/FocusZone";
import { useGlobalZoneRegistry } from "@os/features/focusZone/registry/GlobalZoneRegistry";

// ═══════════════════════════════════════════════════════════════════
// Zone Props (extends FocusZone)
// ═══════════════════════════════════════════════════════════════════

export interface ZoneProps extends FocusZoneProps {
  /** Area identifier for scoped commands */
  area?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Zone Context (for legacy consumers)
// ═══════════════════════════════════════════════════════════════════

export interface ZoneFocusGroupContextValue {
  zoneId: string;
}

export const ZoneFocusGroupContext = createContext<ZoneFocusGroupContextValue | null>(null);
export const useZoneFocusGroup = () => useContext(ZoneFocusGroupContext);

// ═══════════════════════════════════════════════════════════════════
// Zone Component
// ═══════════════════════════════════════════════════════════════════

export function Zone({
  id,
  children,
  ...focusZoneProps
}: ZoneProps) {
  const zoneId = id ?? "zone";

  // Active state for FocusContext
  const activeZoneId = useGlobalZoneRegistry(s => s.activeZoneId);
  const isActive = activeZoneId === zoneId;

  const focusContextValue = useMemo(() => ({
    zoneId,
    isActive
  }), [zoneId, isActive]);

  return (
    <FocusContext.Provider value={focusContextValue}>
      <FocusZone id={zoneId} {...focusZoneProps}>
        {children}
      </FocusZone>
    </FocusContext.Provider>
  );
}
