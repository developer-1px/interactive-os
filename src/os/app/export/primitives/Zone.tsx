import { useRef, useLayoutEffect, useEffect, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { FocusContext, CommandContext } from "@os/features/command/ui/CommandContext.tsx";
import { useFocusStore } from "@os/features/focus/model/focusStore.ts";
import { ZoneRegistry } from "@os/features/jurisdiction/model/ZoneRegistry.ts";
import { DOMInterface } from "@os/features/focus/lib/DOMInterface.ts";

// [NEW] Pipeline-based imports
import { resolveRole } from "@os/features/focus/lib/resolveRole.ts";
import type { NavigateConfig, TabConfig, SelectConfig, ActivateConfig, DismissConfig, ProjectConfig } from "@os/entities/FocusGroupProps.ts";

// [LEGACY] 하위 호환성을 위한 import (deprecated)
import { resolveBehavior } from "@os/features/focus/lib/behaviorResolver.ts";
import type { FocusBehavior } from "@os/entities/FocusBehavior.ts";
import type { FocusDirection } from "@os/entities/FocusDirection.ts";
import type { FocusEdge } from "@os/entities/FocusEdge.ts";
import type { FocusTab } from "@os/entities/FocusTab.ts";
import type { FocusEntry } from "@os/entities/FocusEntry.ts";

// ═══════════════════════════════════════════════════════════════════
// Props Interface (NEW Pipeline-based + LEGACY compat)
// ═══════════════════════════════════════════════════════════════════
export interface ZoneProps {
  id: string;
  children: ReactNode;

  // Metadata
  area?: string;

  // ─── NEW: Pipeline-based Props ───
  role?: string;
  navigate?: Partial<NavigateConfig>;
  // tab: supports both NEW (object) and LEGACY (string)
  tab?: Partial<TabConfig> | FocusTab;
  select?: Partial<SelectConfig>;
  activate?: Partial<ActivateConfig>;
  dismiss?: Partial<DismissConfig>;
  project?: Partial<ProjectConfig>;

  // ─── LEGACY: Flat Props (deprecated, will be removed) ───
  /** @deprecated Use navigate.orientation instead */
  direction?: FocusDirection;
  /** @deprecated Use navigate.loop instead */
  edge?: FocusEdge;
  /** @deprecated Use navigate.entry instead */
  entry?: FocusEntry | 'first' | 'last' | 'restore' | 'selected';
  /** @deprecated Use tab.restoreFocus instead */
  restore?: boolean;
  /** @deprecated Use navigate.seamless instead */
  seamless?: boolean;

  // Other props
  focusable?: boolean;
  payload?: any;
  integrated?: boolean;
  allowedDirections?: ("UP" | "DOWN" | "LEFT" | "RIGHT")[];

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

  // NEW: Pipeline-based
  role,
  navigate: navigateOverrides,
  tab: tabOverrides,
  select: selectOverrides,
  activate: activateOverrides,
  dismiss: dismissOverrides,
  project: projectOverrides,

  // LEGACY: Flat props (deprecated)
  direction: legacyDirection,
  edge: legacyEdge,
  entry: legacyEntry,
  restore: legacyRestore,
  seamless: legacySeamless,

  // Other
  focusable = false,
  integrated = false,
  className,
  style,
  allowedDirections,
}: ZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Global Store & Registry Integration ---
  const focusPath = useFocusStore(state => state.focusPath);
  const focusedItemId = useFocusStore(state => state.focusedItemId);
  const registerZone = useFocusStore(state => state.registerZone);
  const unregisterZone = useFocusStore(state => state.unregisterZone);

  const { registry } = useContext(CommandContext) || {};

  const isInPath = focusPath.includes(id);
  const isFocused = focusedItemId === id;
  const isActive = isInPath;

  // --- Parent Context ---
  const parentContext = useContext(FocusContext);
  const parentId = parentContext?.zoneId;

  // Ref to track registered commands
  const registeredCommandsRef = useRef(new Set<string>());

  // ═══════════════════════════════════════════════════════════════════
  // [NEW] Pipeline-based Behavior Resolution
  // ═══════════════════════════════════════════════════════════════════
  const resolved = useMemo(() => {
    // Normalize tabOverrides: string → object
    const normalizedTabOverrides: Partial<TabConfig> | undefined =
      typeof tabOverrides === 'string'
        ? { behavior: convertTab(tabOverrides as FocusTab) }
        : tabOverrides;

    // Normalize entry: ensure valid FocusEntry
    const normalizedEntry: FocusEntry | undefined =
      legacyEntry === 'last' ? 'first' : legacyEntry as FocusEntry | undefined;

    // LEGACY 감지: 구 props가 사용되었는지 확인
    const hasLegacyProps = legacyDirection !== undefined ||
      legacyEdge !== undefined ||
      legacyEntry !== undefined ||
      legacyRestore !== undefined ||
      legacySeamless !== undefined ||
      typeof tabOverrides === 'string'; // string tab is also legacy

    if (hasLegacyProps) {
      // LEGACY 경로: 구 resolveBehavior 사용 후 변환
      const legacyOverrides: Partial<FocusBehavior> = {
        ...(legacyDirection && { direction: legacyDirection }),
        ...(legacyEdge && { edge: legacyEdge }),
        ...(normalizedEntry && { entry: normalizedEntry }),
        ...(legacyRestore !== undefined && { restore: legacyRestore }),
        ...(legacySeamless !== undefined && { seamless: legacySeamless }),
        ...(typeof tabOverrides === 'string' && { tab: tabOverrides as FocusTab }),
      };
      const legacyBehavior = resolveBehavior(role, legacyOverrides);

      // Convert legacy FocusBehavior to new ResolvedFocusGroup format
      return {
        navigate: {
          orientation: convertDirection(legacyBehavior.direction),
          loop: legacyBehavior.edge === 'loop',
          seamless: legacyBehavior.seamless ?? false,
          typeahead: false,
          entry: legacyBehavior.entry as 'first' | 'last' | 'restore' | 'selected',
          recovery: 'next' as const,
        },
        tab: {
          behavior: convertTab(legacyBehavior.tab),
          restoreFocus: legacyBehavior.restore,
        },
        select: {
          mode: 'none' as const,
          followFocus: false,
          disallowEmpty: false,
          range: false,
          toggle: false,
        },
        activate: {
          mode: 'manual' as const,
        },
        dismiss: {
          escape: 'none' as const,
          outsideClick: 'none' as const,
        },
        project: {
          virtualFocus: legacyBehavior.target === 'virtual',
          autoFocus: false,
        },
        // Keep legacy behavior for backward compat
        _legacyBehavior: legacyBehavior,
      };
    }

    // NEW 경로: resolveRole 사용
    const newResolved = resolveRole(role, {
      navigate: navigateOverrides,
      tab: normalizedTabOverrides,
      select: selectOverrides,
      activate: activateOverrides,
      dismiss: dismissOverrides,
      project: projectOverrides,
    });

    // Convert to legacy for backward compat with handlers
    const entryValue = newResolved.navigate.entry;
    const normalizedEntryValue: FocusEntry =
      entryValue === 'last' ? 'first' : entryValue as FocusEntry;

    const legacyBehavior: FocusBehavior = {
      direction: convertOrientationToDirection(newResolved.navigate.orientation),
      edge: newResolved.navigate.loop ? 'loop' : 'stop',
      tab: convertBehaviorToTab(newResolved.tab.behavior),
      target: newResolved.project.virtualFocus ? 'virtual' : 'real',
      entry: normalizedEntryValue,
      restore: newResolved.tab.restoreFocus,
      seamless: newResolved.navigate.seamless,
    };

    return {
      ...newResolved,
      _legacyBehavior: legacyBehavior,
    };
  }, [
    role,
    navigateOverrides, tabOverrides, selectOverrides,
    activateOverrides, dismissOverrides, projectOverrides,
    legacyDirection, legacyEdge, legacyEntry, legacyRestore, legacySeamless
  ]);

  // 기존 핸들러와 호환을 위한 behavior 객체
  const behavior = resolved._legacyBehavior;

  // ═══════════════════════════════════════════════════════════════════
  // DOM Registry
  // ═══════════════════════════════════════════════════════════════════
  useLayoutEffect(() => {
    if (containerRef.current) {
      DOMInterface.registerZone(id, containerRef.current);
    }
    return () => DOMInterface.unregisterZone(id);
  }, [id]);

  // Command Discovery
  useLayoutEffect(() => {
    const discoveredCommands = ZoneRegistry.getCommands(id);
    if (registry && discoveredCommands.length > 0) {
      discoveredCommands.forEach(cmd => {
        if (cmd && cmd.id) {
          if (!registeredCommandsRef.current.has(cmd.id)) {
            if (!registry.get(cmd.id)) {
              registry.register(cmd);
            }
            registeredCommandsRef.current.add(cmd.id);
          }
        }
      });
    }
  }, [id, registry]);

  // Zone Registration
  const directionsKey = allowedDirections?.join(",") || "";

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

  useEffect(() => {
    return () => unregisterZone(id);
  }, [id, unregisterZone]);

  // Stable Context
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

// ═══════════════════════════════════════════════════════════════════
// Conversion Helpers (LEGACY ↔ NEW)
// ═══════════════════════════════════════════════════════════════════

function convertDirection(dir: FocusDirection): 'horizontal' | 'vertical' | 'both' {
  switch (dir) {
    case 'h': return 'horizontal';
    case 'v': return 'vertical';
    case 'grid': return 'both';
    case 'none': return 'vertical';
    default: return 'vertical';
  }
}

function convertOrientationToDirection(orientation: 'horizontal' | 'vertical' | 'both'): FocusDirection {
  switch (orientation) {
    case 'horizontal': return 'h';
    case 'vertical': return 'v';
    case 'both': return 'grid';
    default: return 'v';
  }
}

function convertTab(tab: FocusTab): 'trap' | 'escape' | 'flow' {
  switch (tab) {
    case 'loop': return 'trap';
    case 'escape': return 'escape';
    case 'flow': return 'flow';
    default: return 'escape';
  }
}

function convertBehaviorToTab(behavior: 'trap' | 'escape' | 'flow'): FocusTab {
  switch (behavior) {
    case 'trap': return 'loop';
    case 'escape': return 'escape';
    case 'flow': return 'flow';
    default: return 'escape';
  }
}
