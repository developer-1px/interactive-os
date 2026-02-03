import { useRef, useLayoutEffect, useContext } from "react";
import type { ReactNode } from "react";
import { FocusContext } from "@os/core/command/CommandContext";
import { useFocusStore } from "@os/core/focus";
import type { NavigationStrategy, InteractionPreset } from "@os/core/navigation";

export interface ZoneProps {
  id: string;
  children: ReactNode;

  // Metadata
  area?: string;

  // Navigation Config
  strategy?: NavigationStrategy; // default: 'spatial'
  preset?: InteractionPreset;    // default: 'seamless'
  layout?: "column" | "row" | "grid";
  navMode?: "clamp" | "wrap";
  focusable?: boolean;           // If true, this zone can also be focused as an item
  payload?: any;                 // Optional data for focusable zones

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
  strategy = "spatial",
  preset = "seamless",
  layout = "column",
  navMode = "clamp",
  focusable = false,
  payload,
  className,
  style,
}: ZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Global Store Integration ---
  const {
    focusPath,
    focusedItemId,
    setFocus,
    registerZone,
    unregisterZone,
    updateZoneItems
  } = useFocusStore();

  const isInPath = focusPath.includes(id); // Ancestor or Self
  const isFocused = focusedItemId === id;
  const isActive = isInPath; // Visual Active State (Grayscale Logic)

  // --- 1. Registration (Identity Awareness) ---
  const context = useContext(FocusContext);
  // If we are nested, our parent is the current context's zoneId
  const parentId = context?.zoneId;

  useLayoutEffect(() => {
    registerZone({
      id,
      parentId,
      area,
      strategy,
      layout,
      preset,
      navMode
    } as any);
    return () => unregisterZone(id);
  }, [id, parentId, area, strategy, layout, preset, navMode, registerZone, unregisterZone]);


  // --- 2. Focus Sync (If focusable) ---
  useLayoutEffect(() => {
    if (focusable && isFocused) {
      setFocus(id, {
        id,
        index: 0,
        payload,
        group: { id: parentId || "root" }
      });
    }
  }, [focusable, isFocused, id, payload, parentId, setFocus]);


  // --- 3. Reactive Item Sync ---
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const syncItems = () => {
      if (!containerRef.current) return;
      // We look for [data-item-id] to know "what's reachable" in this zone
      // CRITICAL: We only want DIRECT children items, but querySelectorAll is subtree.
      // However, our InputEngine handles bubbling, so maybe subtree is fine?
      // Actually, updateZoneItems expects the list of targets.
      const items = Array.from(containerRef.current.querySelectorAll("[data-item-id]"))
        .filter(el => {
          // Only include if this zone is its nearest zone parent
          const nearestZone = el.parentElement?.closest("[data-zone-id]");
          return nearestZone?.getAttribute("data-zone-id") === id;
        })
        .map((el) => el.getAttribute("data-item-id"))
        .filter((id): id is string => !!id);

      updateZoneItems(id, items);
    };

    syncItems();
    const observer = new MutationObserver(syncItems);
    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-item-id"]
    });

    return () => observer.disconnect();
  }, [id, updateZoneItems]);

  return (
    <FocusContext.Provider value={{ zoneId: id, isActive }}>
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
        className={`outline-none h-full flex ${layout === "row" ? "flex-row" : "flex-col"} 
          ${isActive ? "grayscale-0" : "grayscale opacity-80"} 
          transition-all duration-200 ${className || ""}`}
        style={{
          flex: id === "sidebar" ? "none" : "1",
          ...style
        }}
      >
        {children}
      </div>
    </FocusContext.Provider>
  );
}
