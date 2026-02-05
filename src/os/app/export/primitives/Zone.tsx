/**
 * Zone - Facade for FocusGroup
 * 
 * Simple re-export that provides FocusContext for legacy consumers.
 * All focus behavior is delegated to FocusGroup.
 */

import { useContext, useMemo, createContext } from "react";
import { FocusContext } from "@os/features/command/ui/CommandContext";
import { FocusGroup, type FocusGroupProps } from "@os/features/focus/primitives/FocusGroup";
import { useFocusRegistry } from "@os/features/focus/registry/FocusRegistry";

// ═══════════════════════════════════════════════════════════════════
// Zone Props (extends FocusGroup)
// ═══════════════════════════════════════════════════════════════════

export interface ZoneProps extends FocusGroupProps {
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
  ...focusGroupProps
}: ZoneProps) {
  const zoneId = id ?? "zone";

  // Active state for FocusContext
  const activeZoneId = useFocusRegistry(s => s.activeZoneId);
  const isActive = activeZoneId === zoneId;

  const focusContextValue = useMemo(() => ({
    zoneId,
    isActive
  }), [zoneId, isActive]);

  return (
    <FocusContext.Provider value={focusContextValue}>
      <FocusGroup id={zoneId} {...focusGroupProps}>
        {children}
      </FocusGroup>
    </FocusContext.Provider>
  );
}
