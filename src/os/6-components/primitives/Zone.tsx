/**
 * Zone — OS interaction jurisdiction (composition point).
 *
 * Zone owns:
 *   - Zone ID generation (zone-N)
 *   - ZoneEntry registration (ZoneRegistry)
 *   - Lifecycle effects (OS_ZONE_INIT, bindElement, autoFocus, Stack)
 *   - ZoneContext (zoneId, scope)
 *   - Container element rendering (the div that receives all OS props)
 *   - App callback routing (onCopy, onDelete, onUndo, ...)
 *
 * Zone delegates config resolution and context provision to FocusGroup (headless).
 * FocusGroup runs in headless mode: no DOM, no registration, only context.
 * Zone renders the container div and applies zone-level + focus-level props.
 *
 * Future capabilities (DnD, Resize) will be additional headless children,
 * composed in the same ZoneContext without extra DOM nesting.
 */

import type { BaseCommand } from "@kernel/core/tokens";
import { defineScope } from "@kernel";
import type { ZoneCallback } from "@os/2-contexts/zoneRegistry";
import {
  FocusGroup,
  useFocusContext,
  type ZoneContextValue,
} from "@os/6-components/base/FocusGroup.tsx";
import {
  useZoneLifecycle,
  type ZoneCallbacks,
} from "@os/6-components/base/useZoneLifecycle.ts";
import { os } from "@os/kernel.ts";
import { resolveRole, type ZoneRole } from "@os/registries/roleRegistry.ts";
import type {
  ActivateConfig,
  DismissConfig,
  NavigateConfig,
  ProjectConfig,
  SelectConfig,
  TabConfig,
} from "@os/schemas";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
} from "react";

// ═══════════════════════════════════════════════════════════════════
// Zone Context (provided by Zone, consumed by all capabilities)
// ═══════════════════════════════════════════════════════════════════

const ZoneContext = createContext<ZoneContextValue | null>(null);

/** Read zone-level identity (zoneId, scope). Usable by any capability or app code. */
export function useZoneContext() {
  return useContext(ZoneContext);
}

// ═══════════════════════════════════════════════════════════════════
// Zone ID Generator
// ═══════════════════════════════════════════════════════════════════

let zoneIdCounter = 0;
function generateZoneId() {
  return `zone-${++zoneIdCounter}`;
}

// ═══════════════════════════════════════════════════════════════════
// Zone Props
// ═══════════════════════════════════════════════════════════════════

/** Advanced configuration overrides - use sparingly, prefer role presets */
export interface ZoneOptions {
  navigate?: Partial<NavigateConfig>;
  tab?: Partial<TabConfig>;
  select?: Partial<SelectConfig>;
  activate?: Partial<ActivateConfig>;
  dismiss?: Partial<DismissConfig>;
  project?: Partial<ProjectConfig>;
}

export interface ZoneProps
  extends Omit<
    ComponentProps<"div">,
    "id" | "role" | "onSelect" | "onCopy" | "onCut" | "onPaste" | "onCheck"
  > {
  /** Unique identifier for the zone */
  id?: string;
  /** ARIA role preset that determines all navigation/tab/select behavior */
  role?: ZoneRole;
  /** Advanced config overrides (use sparingly) */
  options?: ZoneOptions;
  /** Callback for item activation (Enter key) */
  onAction?: ZoneCallback;
  /** Callback for item selection (Space key) */
  onSelect?: ZoneCallback;
  /** Callback for copy (Cmd+C) */
  onCopy?: ZoneCallback;
  /** Callback for cut (Cmd+X) */
  onCut?: ZoneCallback;
  /** Callback for paste (Cmd+V) */
  onPaste?: ZoneCallback;
  /** Callback for check (Space) - for aria-checked state */
  onCheck?: ZoneCallback;
  /** Callback for delete (Backspace/Delete) */
  onDelete?: ZoneCallback;
  /** Callback for move up (Meta+ArrowUp) */
  onMoveUp?: ZoneCallback;
  /** Callback for move down (Meta+ArrowDown) */
  onMoveDown?: ZoneCallback;
  /** Command dispatched on undo (Cmd+Z) */
  onUndo?: BaseCommand;
  /** Command dispatched on redo (Cmd+Shift+Z) */
  onRedo?: BaseCommand;
  /** Command dispatched when the zone is dismissed (ESC key) */
  onDismiss?: BaseCommand;
  /** Dynamic item filter — controls which items are keyboard-navigable at runtime */
  itemFilter?: (items: string[]) => string[];
  /** Item accessor — returns ordered item IDs for stale focus recovery */
  getItems?: () => string[];
  /** Expandable item accessor */
  getExpandableItems?: () => Set<string>;
  /** Tree level accessor */
  getTreeLevels?: () => Map<string, number>;
  /** Drag reorder callback — invoked when an item is drag-dropped to a new position */
  onReorder?: (info: {
    itemId: string;
    overItemId: string;
    position: "before" | "after";
  }) => BaseCommand | BaseCommand[];
  /** Children */
  children: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════
// Zone Container — renders the div with merged zone + focus props
// ═══════════════════════════════════════════════════════════════════

function ZoneContainer({
  zoneId,
  isActive,
  containerRef,
  children,
  className,
  style,
  role,
  ...rest
}: {
  zoneId: string;
  isActive: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  role?: ZoneRole;
} & Omit<
  ComponentProps<"div">,
  "id" | "role" | "onSelect" | "onCopy" | "onCut" | "onPaste" | "onCheck"
>) {
  // Read focus config from FocusContext (populated by headless FocusGroup)
  const focusCtx = useFocusContext();
  const config = focusCtx?.config;
  const effectiveRole = focusCtx?.role ?? role;
  const orientation = config?.navigate.orientation;

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is dynamic (listbox/toolbar/grid)
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
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
      aria-multiselectable={config?.select.mode === "multiple" || undefined}
      role={effectiveRole || "group"}
      tabIndex={-1}
      className={className || undefined}
      data-orientation={orientation}
      style={{ outline: "none", ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Zone Component
// ═══════════════════════════════════════════════════════════════════

export function Zone({
  id,
  role,
  options,
  onAction,
  onSelect,
  onCheck,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onMoveUp,
  onMoveDown,
  onUndo,
  onRedo,
  onDismiss,
  itemFilter,
  getItems,
  getExpandableItems,
  getTreeLevels,
  onReorder,
  children,
  className,
  style,
  ...rest
}: ZoneProps) {
  // ─── Zone ID (stable, auto-generated if not provided) ───
  const zoneId = useMemo(() => id || generateZoneId(), [id]);

  // ─── Scope (defaults to zoneId) ───
  const scope = useMemo(() => defineScope(zoneId), [zoneId]);

  // ─── Config (resolved from role + options) ───
  const config = useMemo(() => {
    const overrides: {
      navigate?: Partial<NavigateConfig>;
      tab?: Partial<TabConfig>;
      select?: Partial<SelectConfig>;
      activate?: Partial<ActivateConfig>;
      dismiss?: Partial<DismissConfig>;
      project?: Partial<ProjectConfig>;
    } = {};
    if (options?.navigate !== undefined) overrides.navigate = options.navigate;
    if (options?.tab !== undefined) overrides.tab = options.tab;
    if (options?.select !== undefined) overrides.select = options.select;
    if (options?.activate !== undefined) overrides.activate = options.activate;
    if (options?.dismiss !== undefined) overrides.dismiss = options.dismiss;
    if (options?.project !== undefined) overrides.project = options.project;
    return resolveRole(role, overrides);
  }, [role, options]);

  // ─── Callbacks bag ───
  const callbacks = useMemo<ZoneCallbacks>(
    () => ({
      onAction,
      onSelect,
      onCheck,
      onDelete,
      onMoveUp,
      onMoveDown,
      onCopy,
      onCut,
      onPaste,
      onUndo,
      onRedo,
      onDismiss,
      itemFilter,
      getItems,
      getExpandableItems,
      getTreeLevels,
      onReorder,
    }),
    // biome-ignore lint/correctness/useExhaustiveDependencies: callbacks are captured in ref inside hook
    [],
  );

  // ─── Container ref ───
  const containerRef = useRef<HTMLElement | null>(null);

  // ─── Registration + Lifecycle (the hook does everything) ───
  useZoneLifecycle(zoneId, config, role, null, containerRef, callbacks);

  // ─── ZoneContext value ───
  const zoneContextValue = useMemo<ZoneContextValue>(
    () => ({ zoneId, scope }),
    [zoneId, scope],
  );

  // ─── Is Active ───
  const isActive = os.useComputed((s) => s.os.focus.activeZoneId === zoneId);

  // ─── Render: Zone provides context, delegates config to headless FocusGroup ───
  return (
    <ZoneContext.Provider value={zoneContextValue}>
      <FocusGroup
        id={zoneId}
        scope={scope}
        headless
        containerRef={containerRef}
        config={config}
        role={role}
      >
        <ZoneContainer
          zoneId={zoneId}
          isActive={isActive}
          containerRef={containerRef}
          {...(role !== undefined ? { role } : {})}
          {...(className !== undefined ? { className } : {})}
          {...(style !== undefined ? { style } : {})}
          {...rest}
        >
          {children}
        </ZoneContainer>
      </FocusGroup>
    </ZoneContext.Provider>
  );
}

// Re-export context hooks for convenience
export {
  useFocusContext,
  useFocusGroupContext,
} from "@os/6-components/base/FocusGroup.tsx";
