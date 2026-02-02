import { useEffect, useRef } from "react";
import type { CommandRegistry } from "@os/core/command/store";
import { evalContext } from "@os/core/context";
import { getCanonicalKey, normalizeKeyDefinition } from "@os/core/input/keybinding";
import type { ReactNode } from "react";
import { FocusContext, useCommandEngine } from "@os/core/command/CommandContext";
import type { BaseCommand } from "@os/ui/types";
import { useFocusStore } from "@os/core/focus";


export interface ZoneNeighbors {
  up?: string;
  down?: string;
  left?: string;
  right?: string;
}

export interface ZoneProps {
  id: string;
  children: ReactNode;
  dispatch?: (cmd: BaseCommand) => void;
  currentFocusId?: string | null;
  defaultFocusId?: string;
  registry?: CommandRegistry<any, any, any>;
  /** Area semantic for Jurisdiction */
  area?: string;
  /** Manual override for active state */
  active?: boolean;

  /** Focus Topology: Neighbors */
  neighbors?: ZoneNeighbors;
  /** Focus Layout: Internal Navigation Strategy */
  layout?: "column" | "row" | "grid";
  /** Ordered list of focusable IDs for generic navigation */
  items?: string[];
  /** Navigation Behavior: 'clamp' (stop at end) or 'wrap' (loop) */
  navMode?: "clamp" | "wrap";
}

export function Zone({
  id,
  children,
  dispatch: customDispatch,
  // currentFocusId: customFocusId,
  defaultFocusId,
  registry: customRegistry,
  area,
  active,
  neighbors,
  layout = "column",
  items = [],
  navMode = "clamp",
}: ZoneProps) {
  const {
    dispatch: contextDispatch,
    registry: contextRegistry,
    ctx,
  } = useCommandEngine();
  const dispatch = customDispatch || contextDispatch;
  const registry = customRegistry || contextRegistry;

  // --- Focus Store Integration (Jurisdictional Focus) ---
  const activeZoneId = useFocusStore((s) => s.activeZoneId);
  const registerZone = useFocusStore((s) => s.registerZone);
  const unregisterZone = useFocusStore((s) => s.unregisterZone);
  const setActiveZone = useFocusStore((s) => s.setActiveZone);

  // Register this zone with the window manager
  // Now includes `items` and `navMode` for generic navigation!
  // Register this zone with the window manager
  // Now includes `items` and `navMode` for generic navigation!
  useEffect(() => {
    registerZone({ id, area, defaultFocusId, items, navMode, neighbors, layout });
    return () => unregisterZone(id);
  }, [id, area, defaultFocusId, registerZone, unregisterZone, items, navMode, neighbors, layout]);

  // Active state is now derived from the global store (unless manually overridden)
  const isStoreActive = activeZoneId === id;
  const isActive = active !== undefined ? active : isStoreActive;

  // Fix: Use ref to prevent stale closure in event listener without thrashing dependencies
  const ctxRef = useRef(ctx);
  useEffect(() => {
    ctxRef.current = ctx;
  }, [ctx]);

  // --- Dynamic Keybinding Lifecycle (Event Bubbling / Virtual Focus) ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // 1. Basic Filters
    if (e.defaultPrevented) return;

    // Check if we are in an input field (Extrinsic State for Context)
    const activeEl = document.activeElement as HTMLElement;
    const isInput =
      activeEl &&
      (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable);

    const isAtStart = isInput && activeEl.tagName === "INPUT"
      ? (activeEl as HTMLInputElement).selectionStart === 0 &&
      (activeEl as HTMLInputElement).selectionEnd === 0
      : false;

    // Inject extrinsic state into context
    const runtimeCtx = { ...ctxRef.current, cursorAtStart: isAtStart };

    // 2. Resolve Command
    // Priority: Registry (Zone/Context) -> Bubble Up
    if (registry && typeof registry.getKeybindings === "function") {
      const bindings = registry.getKeybindings();
      const canonicalEventKey = getCanonicalKey(e.nativeEvent);

      const matches = bindings.filter((b: { key: string }) => {
        const normalizedDef = normalizeKeyDefinition(b.key);
        return normalizedDef === canonicalEventKey;
      });

      if (matches.length > 0) {
        // Find the first ENABLED command for this key
        const activeMatch = matches.find((match: any) => {
          const isEnabled = match.when
            ? evalContext(match.when, runtimeCtx)
            : true;

          // Input Safety Gate
          if (isEnabled && isInput && !match.allowInInput) {
            return false;
          }
          return isEnabled;
        });

        if (activeMatch) {
          e.preventDefault();
          e.stopPropagation(); // Handled! Stop bubbling.
          dispatch({ type: activeMatch.command, payload: activeMatch.args });
          return;
        }
      }
    }

    // 3. Spatial Navigation (Universal)
    // Only handle if not in an input (unless we strictly want to override)
    // 3. Spatial Navigation (Universal)
    if (isActive) {
      let direction: "UP" | "DOWN" | "LEFT" | "RIGHT" | undefined;

      switch (e.key) {
        case "ArrowUp":
          direction = "UP";
          break;
        case "ArrowDown":
          direction = "DOWN";
          break;
        case "ArrowLeft":
          direction = "LEFT";
          break;
        case "ArrowRight":
          direction = "RIGHT";
          break;
      }

      // Guard: Allow Text Inputs to handle their own lateral cursor movement
      if (isInput && (direction === "LEFT" || direction === "RIGHT")) {
        direction = undefined;
      }

      if (direction) {
        e.preventDefault();
        e.stopPropagation();

        // Dispatch generic Intent. Middleware determines if it's Internal (Item) or External (Zone).
        dispatch({
          type: `NAVIGATE_${direction}`,
          payload: {},
        });
      }
    }
  };

  const handleFocus = (e: React.FocusEvent) => {
    // 1. Claim Jurisdiction
    if (!isActive) {
      setActiveZone(id);
    }

    // 2. Claim Physical Focus (if we are the container)
    // If e.target is the container itself, we are good.
    // If e.target is a child (input), we let it keep focus but we are 'active' zone.
    // Only if we focused the Zone container itself (not a child)
    if (e.target === e.currentTarget && defaultFocusId) {
      useFocusStore.getState().setFocus(defaultFocusId);
    }
  };

  const handleClick = () => {
    // 1. Claim Jurisdiction
    if (!isActive) {
      setActiveZone(id);

      // 2. Restore Focus if needed
      if (defaultFocusId) {
        useFocusStore.getState().setFocus(defaultFocusId);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // OS Focus Trap: Reclaim focus if it drops to body while active
    if (isActive && !e.relatedTarget) {
      e.currentTarget.focus();
    }
  };

  // Ensure we can receive physical focus for Virtual Focus Mode
  // If active, we are the 'application' root for this section.
  const activeDescendant = isActive && useFocusStore.getState().focusedItemId
    ? String(useFocusStore.getState().focusedItemId)
    : undefined;

  return (
    <FocusContext.Provider value={{ zoneId: id, isActive }}>
      <div
        data-zone-id={id}
        data-area={area}
        data-active={isActive}
        role="application"
        aria-activedescendant={activeDescendant}
        tabIndex={0} // Active Host
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        onFocusCapture={() => {
          // Aggressive capture for reliable "Click anywhere to activate"
          if (!isActive) setActiveZone(id);
        }}
        className="outline-none transition-all duration-700 h-full flex flex-col data-[active=false]:grayscale data-[active=false]:opacity-30 data-[active=false]:scale-[0.98] data-[active=false]:blur-[0.5px] data-[active=true]:grayscale-0 data-[active=true]:opacity-100 data-[active=true]:scale-100"
        style={{ flex: id === "sidebar" ? "none" : "1" }}
      >
        {children}
      </div>
    </FocusContext.Provider>
  );
}
