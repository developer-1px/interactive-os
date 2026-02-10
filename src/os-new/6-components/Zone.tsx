/**
 * Zone — Kernel-based focus zone (replaces FocusGroup).
 *
 * On mount:
 *   1. Resolve config from role + overrides (reuses resolveRole)
 *   2. Register in ZoneRegistry (for context providers)
 *   3. Dispatch OS_FOCUS to initialize zone state
 *
 * On unmount:
 *   Unregister from ZoneRegistry
 *
 * Rendering:
 *   - Provides ZoneContext (zoneId + config) to children
 *   - Renders a div with ARIA attributes
 *   - No Zustand, no FocusData, no global variables
 */

import { defineScope, type ScopeToken } from "@kernel";
import { produce } from "immer";
import {
  type ComponentProps,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { ZoneRegistry } from "../2-contexts/zoneRegistry";
import { useActiveZone } from "../5-hooks/useActiveZone";
import { kernel } from "../kernel";
import { resolveRole, type ZoneRole } from "../registry/roleRegistry";
import type {
  ActivateConfig,
  DismissConfig,
  NavigateConfig,
  ProjectConfig,
  SelectConfig,
  TabConfig,
} from "../schema";
import { initialZoneState } from "../state/initial";
import { ZoneContext, type ZoneContextValue } from "./ZoneContext";

// ═══════════════════════════════════════════════════════════════════
// ID Generator
// ═══════════════════════════════════════════════════════════════════

let zoneIdCounter = 0;
function generateZoneId() {
  return `zone-${++zoneIdCounter}`;
}

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

export interface ZoneProps
  extends Omit<
    ComponentProps<"div">,
    "id" | "role" | "style" | "className" | "onSelect"
  > {
  /** Zone ID (auto-generated if not provided) */
  id?: string;

  /** ARIA role preset (resolves config automatically) */
  role?: ZoneRole;

  /** Navigation config overrides */
  navigate?: Partial<NavigateConfig>;

  /** Tab config overrides */
  tab?: Partial<TabConfig>;

  /** Select config overrides */
  select?: Partial<SelectConfig>;

  /** Activate config overrides */
  activate?: Partial<ActivateConfig>;

  /** Dismiss config overrides */
  dismiss?: Partial<DismissConfig>;

  /** Project config overrides */
  project?: Partial<ProjectConfig>;

  /** Kernel scope (for scoped command handlers). Defaults to zoneId. */
  scope?: ScopeToken;

  /** Children */
  children: ReactNode;

  /** Container className */
  className?: string;

  /** Container style */
  style?: React.CSSProperties;
}

// ═══════════════════════════════════════════════════════════════════
// Init command (module-scoped, lightweight)
// ═══════════════════════════════════════════════════════════════════

const INIT_ZONE = kernel.defineCommand(
  "ZONE_INIT",
  (ctx) => (zoneId: string) => {
    if (ctx.state.os.focus.zones[zoneId]) return; // already init
    return {
      state: produce(ctx.state, (draft) => {
        draft.os.focus.zones[zoneId] = { ...initialZoneState };
      }),
    };
  },
);

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function Zone({
  id: propId,
  role,
  navigate,
  tab,
  select,
  activate,
  dismiss,
  project,
  scope: propScope,
  children,
  className,
  style,
  ...rest
}: ZoneProps) {
  // --- Stable ID ---
  const zoneId = useMemo(() => propId || generateZoneId(), [propId]);

  // --- Scope Token (defaults to zoneId) ---
  const scope = useMemo(
    () => propScope ?? defineScope(zoneId),
    [propScope, zoneId],
  );

  // --- Resolve Configuration ---
  const config = useMemo(() => {
    const filteredOverrides: {
      navigate?: Partial<NavigateConfig>;
      tab?: Partial<TabConfig>;
      select?: Partial<SelectConfig>;
      activate?: Partial<ActivateConfig>;
      dismiss?: Partial<DismissConfig>;
      project?: Partial<ProjectConfig>;
    } = {};
    if (navigate !== undefined) filteredOverrides.navigate = navigate;
    if (tab !== undefined) filteredOverrides.tab = tab;
    if (select !== undefined) filteredOverrides.select = select;
    if (activate !== undefined) filteredOverrides.activate = activate;
    if (dismiss !== undefined) filteredOverrides.dismiss = dismiss;
    if (project !== undefined) filteredOverrides.project = project;
    return resolveRole(role, filteredOverrides);
  }, [role, navigate, tab, select, activate, dismiss, project]);

  // --- Container Ref ---
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Register in ZoneRegistry + init kernel state ---
  useLayoutEffect(() => {
    // Init kernel state for this zone
    kernel.dispatch(INIT_ZONE(zoneId));

    // Register in ZoneRegistry (for context providers)
    if (containerRef.current) {
      ZoneRegistry.register(zoneId, {
        config,
        element: containerRef.current,
        ...(role !== undefined ? { role } : {}),
        parentId: null, // TODO: read from parent ZoneContext
      });
    }

    return () => {
      ZoneRegistry.unregister(zoneId);
    };
  }, [zoneId, config, role]);

  // --- Is Active ---
  const activeZoneId = useActiveZone();
  const isActive = activeZoneId === zoneId;

  // --- Context Value ---
  const contextValue = useMemo<ZoneContextValue>(
    () => ({
      zoneId,
      config,
      ...(role !== undefined ? { role } : {}),
      scope,
    }),
    [zoneId, config, role, scope],
  );

  // --- Orientation ---
  const orientation = config.navigate.orientation;

  // --- Render ---
  return (
    <ZoneContext.Provider value={contextValue}>
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is dynamic (listbox/toolbar/grid) */}
      <div
        ref={containerRef}
        id={zoneId}
        data-zone={zoneId}
        aria-current={isActive ? "true" : undefined}
        aria-orientation={
          orientation === "horizontal"
            ? "horizontal"
            : orientation === "vertical"
              ? "vertical"
              : undefined
        }
        aria-multiselectable={config.select.mode === "multiple" || undefined}
        role={role || "group"}
        tabIndex={-1}
        className={className || undefined}
        data-orientation={orientation}
        style={{ outline: "none", ...style }}
        {...rest}
      >
        {children}
      </div>
    </ZoneContext.Provider>
  );
}

Zone.displayName = "Zone";
