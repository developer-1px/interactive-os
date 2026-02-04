import { useRef, useLayoutEffect, useEffect, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { FocusContext, CommandContext } from "@os/core/command/CommandContext";
import { useFocusStore } from "@os/core/focus/focusStore";
import { ZoneRegistry } from "@os/core/command/zoneRegistry";
import { resolveBehavior, type FocusBehavior, type FocusDirection, type FocusEdge, type FocusTab, type FocusEntry } from "@os/core/focus/behavior/behaviorResolver";

export interface ZoneProps {
  id: string;
  children: ReactNode;

  // Metadata
  area?: string;

  // Focus Behavior (6-Axis System)
  role?: string;           // Auto-resolve from FOCUS_PRESETS
  direction?: FocusDirection;
  edge?: FocusEdge;
  tab?: FocusTab;
  entry?: FocusEntry;
  restore?: boolean;
  seamless?: boolean;      // Enable spatial cross-zone navigation (TV-like)

  focusable?: boolean;           // If true, this zone can also be focused as an item
  payload?: any;                 // Optional data for focusable zones
  integrated?: boolean;          // If true, nested items register with parent zone instead

  // Declared Capabilities (Zero-Config Discovery)

  // Overrides (Legacy Compat - but we ignore handlers now)
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
  dispatch?: any;
  registry?: any;
}

/**
 * [Zero-Base] Zone: The Jurisdictional Boundary
 *
 * This component is now PURELY DECLARATIVE.
 * It does NOT handle events. It only registers metadata and provides a DOM marker.
 * All interactions are handled by the Global InputEngine.
 */
export function Zone({
  id,
  children,
  area,

  // 6-Axis Behavior
  role,
  direction,
  edge,
  tab,
  entry,
  restore,
  seamless,

  focusable = false,
  integrated = false,
  className,
  style,
  allowedDirections,
}: ZoneProps & {
  allowedDirections?: ("UP" | "DOWN" | "LEFT" | "RIGHT")[],
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Global Store & Registry Integration ---
  // FIXED: Use selectors to prevent re-renders when zoneRegistry updates (stopping the specific discovery loop)
  const focusPath = useFocusStore(state => state.focusPath);
  const focusedItemId = useFocusStore(state => state.focusedItemId);

  // Actions (Stable references)
  const registerZone = useFocusStore(state => state.registerZone);
  const unregisterZone = useFocusStore(state => state.unregisterZone);

  const { registry } = useContext(CommandContext) || {}; // Access Registry for JIT Registration

  const isInPath = focusPath.includes(id); // Ancestor or Self
  const isFocused = focusedItemId === id;
  const isActive = isInPath; // Visual Active State (Grayscale Logic)

  // --- 1. Registration (Identity & Capability Awareness) ---
  const parentContext = useContext(FocusContext);
  // If we are nested, our parent is the current context's zoneId
  const parentId = parentContext?.zoneId;

  // Ref to track registered commands and prevent redundant registration calls
  const registeredCommandsRef = useRef(new Set<string>());

  useLayoutEffect(() => {
    // A. Capability Registration (Zero-Config Discovery)
    const discoveredCommands = ZoneRegistry.getCommands(id);
    if (registry && discoveredCommands.length > 0) {
      discoveredCommands.forEach(cmd => {
        // Duck Type Check
        if (cmd && cmd.id) {
          // Check if WE already registered this command in this component instance
          if (!registeredCommandsRef.current.has(cmd.id)) {
            // Check if Registry already has it (Global prevention)
            if (!registry.get(cmd.id)) {
              registry.register(cmd);
            }
            // Mark as handled for this component lifecycle
            registeredCommandsRef.current.add(cmd.id);
          }
        }
      });
    }
  }, [id, registry]);

  // --- 1. Zone Registration (Lifecycle) ---
  const directionsKey = allowedDirections?.join(",") || "";

  // [Role-Based] Resolve FocusBehavior
  const behavior = useMemo(() => {
    const overrides: Partial<FocusBehavior> = {
      ...(direction && { direction }),
      ...(edge && { edge }),
      ...(tab && { tab }),
      ...(entry && { entry }),
      ...(restore !== undefined && { restore }),
      ...(seamless !== undefined && { seamless }),
    };
    return resolveBehavior(role, overrides);
  }, [role, direction, edge, tab, entry, restore, seamless]);

  // Registration: Update on every relevant prop change (registerZone handles merging)
  useEffect(() => {
    registerZone({
      id,
      parentId,
      area,
      behavior,
      allowedDirections,
      items: [],
    } as any);
  }, [
    id,
    parentId,
    area,
    behavior,
    directionsKey,
    registerZone,
  ]);

  // Cleanup: Only unregister on unmount (when component is removed)
  useEffect(() => {
    return () => unregisterZone(id);
  }, [id, unregisterZone]);



  // --- 4. Stable Context ---
  const focusContextValue = useMemo(() => ({
    zoneId: integrated && parentContext ? parentContext.zoneId : id,
    isActive
  }), [id, isActive, integrated, parentContext]);

  return (
    <FocusContext.Provider value={focusContextValue}>
      <div
        ref={containerRef}
        id={id}
        data-zone-id={id}
        data-item-id={focusable ? id : undefined}
        data-active={isActive}
        data-focused={isFocused}
        data-area={area}
        role="region"
        aria-label={area || id}
        tabIndex={behavior.tab === "escape" && !parentId ? 0 : -1}
        className={`outline-none h-full flex ${behavior.direction === "h" || behavior.direction === "grid" ? "flex-row" : "flex-col"} 
          ${isActive ? "grayscale-0" : "grayscale opacity-80"} 
          transition-all duration-200 ${className || ""}`}
        style={{
          ...style
        }}
      >
        {children}
      </div>
    </FocusContext.Provider>
  );
}
