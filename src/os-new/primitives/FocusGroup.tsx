/**
 * FocusGroup — Kernel-based focus zone primitive.
 *
 * On mount:
 *   1. Resolve config from role + overrides (reuses resolveRole)
 *   2. Register in ZoneRegistry (for context providers)
 *   3. Dispatch ZONE_INIT to initialize zone state in kernel
 *
 * On unmount:
 *   Unregister from ZoneRegistry
 *
 * Context provides { zoneId, config, role?, scope } — same shape as ZoneContext.
 * No Zustand, no FocusData, no global mutable state.
 */
import { defineScope, type ScopeToken, type AnyCommand } from "@kernel";
import { produce } from "immer";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { ZoneRegistry } from "../2-contexts/zoneRegistry.ts";
import { FOCUS } from "../3-commands/focus.ts";
import { STACK_POP, STACK_PUSH } from "../3-commands/stack.ts";
import { kernel } from "../kernel.ts";
import { resolveRole, type ZoneRole } from "../registry/roleRegistry.ts";
import type {
  ActivateConfig,
  DismissConfig,
  FocusGroupConfig,
  NavigateConfig,
  ProjectConfig,
  SelectConfig,
  TabConfig,
} from "../schema";
import type { BaseCommand } from "../schema/command/BaseCommand.ts";
import { initialZoneState } from "../state/initial.ts";

// ═══════════════════════════════════════════════════════════════════
// Context (same shape as ZoneContextValue)
// ═══════════════════════════════════════════════════════════════════

export interface FocusGroupContextValue {
  zoneId: string;
  config: FocusGroupConfig;
  zoneRole?: ZoneRole;
  scope: ScopeToken;
}

const FocusGroupContext = createContext<FocusGroupContextValue | null>(null);

export function useFocusGroupContext() {
  return useContext(FocusGroupContext);
}

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

export interface FocusGroupProps
  extends Omit<
    ComponentProps<"div">,
    | "id"
    | "role"
    | "style"
    | "className"
    | "onSelect"
    | "onCopy"
    | "onCut"
    | "onPaste"
    | "onToggle"
  > {
  /** Group ID (optional, auto-generated if not provided) */
  id?: string;

  /** ARIA role preset */
  role?: ZoneRole;

  /** Navigate configuration */
  navigate?: Partial<NavigateConfig>;

  /** Tab configuration */
  tab?: Partial<TabConfig>;

  /** Select configuration */
  select?: Partial<SelectConfig>;

  /** Activate configuration */
  activate?: Partial<ActivateConfig>;

  /** Dismiss configuration */
  dismiss?: Partial<DismissConfig>;

  /** Project configuration */
  project?: Partial<ProjectConfig>;

  /** Command dispatched on item activation (Enter key) */
  onAction?: BaseCommand;

  /** Command dispatched on item selection (Space key) */
  onSelect?: BaseCommand;

  /** Command dispatched on copy (Cmd+C) */
  onCopy?: BaseCommand;

  /** Command dispatched on cut (Cmd+X) */
  onCut?: BaseCommand;

  /** Command dispatched on paste (Cmd+V) */
  onPaste?: BaseCommand;

  /** Command dispatched on toggle (Space) - for checkboxes, multi-select */
  onToggle?: BaseCommand;

  /** Command dispatched on delete (Backspace/Delete) */
  onDelete?: BaseCommand;

  /** Command dispatched on undo (Cmd+Z) */
  onUndo?: BaseCommand;

  /** Command dispatched on redo (Cmd+Shift+Z) */
  onRedo?: BaseCommand;

  /** Kernel scope (for scoped command handlers). Defaults to groupId. */
  scope?: ScopeToken;

  /** Command dispatched when zone is dismissed (ESC with dismiss.escape: "close") */
  onDismiss?: AnyCommand;

  /** Children */
  children: ReactNode;

  /** Container className */
  className?: string;

  /** Container style */
  style?: React.CSSProperties;
}

// ═══════════════════════════════════════════════════════════════════
// ID Generator
// ═══════════════════════════════════════════════════════════════════

let groupIdCounter = 0;
function generateGroupId() {
  return `focus-group-${++groupIdCounter}`;
}

// ═══════════════════════════════════════════════════════════════════
// Init command (module-scoped, lightweight)
// ═══════════════════════════════════════════════════════════════════

const INIT_ZONE = kernel.defineCommand(
  "FOCUS_GROUP_INIT",
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

export function FocusGroup({
  id: propId,
  role,
  navigate,
  tab,
  select,
  activate,
  dismiss,
  project,
  scope: propScope,
  onAction: _onAction,
  onSelect: _onSelect,
  onCopy: _onCopy,
  onCut: _onCut,
  onPaste: _onPaste,
  onToggle: _onToggle,
  onDelete: _onDelete,
  onUndo: _onUndo,
  onRedo: _onRedo,
  onDismiss,
  children,
  className,
  style,
  ...rest
}: FocusGroupProps) {
  // --- Stable ID ---
  const groupId = useMemo(() => propId || generateGroupId(), [propId]);

  // --- Scope Token (defaults to groupId) ---
  const scope = useMemo(
    () => propScope ?? defineScope(groupId),
    [propScope, groupId],
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

  // --- Parent Context ---
  const parentContext = useContext(FocusGroupContext);
  const parentId = parentContext?.zoneId || null;

  // --- Container Ref ---
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Register in ZoneRegistry + init kernel state ---
  useLayoutEffect(() => {
    // Init kernel state for this zone
    kernel.dispatch(INIT_ZONE(groupId));

    // Register in ZoneRegistry (for context providers)
    if (containerRef.current) {
      ZoneRegistry.register(groupId, {
        config,
        element: containerRef.current,
        ...(role !== undefined ? { role } : {}),
        parentId,
        ...(onDismiss !== undefined ? { onDismiss } : {}),
        ...(_onCopy !== undefined ? { onCopy: _onCopy } : {}),
        ...(_onCut !== undefined ? { onCut: _onCut } : {}),
        ...(_onPaste !== undefined ? { onPaste: _onPaste } : {}),
        ...(_onUndo !== undefined ? { onUndo: _onUndo } : {}),
        ...(_onRedo !== undefined ? { onRedo: _onRedo } : {}),
      });
    }

    return () => {
      ZoneRegistry.unregister(groupId);
    };
  }, [groupId, config, role, parentId, onDismiss]);

  // --- AutoFocus: focus first item on mount when config.project.autoFocus ---
  useEffect(() => {
    if (!config.project.autoFocus) return;
    if (!containerRef.current) return;

    // Wait one frame for children to render
    const raf = requestAnimationFrame(() => {
      const firstItem =
        containerRef.current?.querySelector<HTMLElement>("[data-focus-item]");
      if (firstItem) {
        const itemId = firstItem.getAttribute("data-item-id") || firstItem.id;
        if (itemId) {
          kernel.dispatch(FOCUS({ zoneId: groupId, itemId }));
        }
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [groupId, config.project.autoFocus]);

  // --- Auto Focus Stack for dialog/alertdialog ---
  // When autoFocus is true, push focus stack on mount and pop on unmount
  useEffect(() => {
    if (!config.project.autoFocus) return;
    kernel.dispatch(STACK_PUSH());
    return () => {
      kernel.dispatch(STACK_POP());
    };
  }, [groupId, config.project.autoFocus]);



  // --- Is Active ---
  const activeZoneId = kernel.useComputed((s) => s.os.focus.activeZoneId);
  const isActive = activeZoneId === groupId;

  // --- Context Value ---
  const contextValue = useMemo<FocusGroupContextValue>(
    () => ({
      zoneId: groupId,
      config,
      ...(role !== undefined ? { zoneRole: role } : {}),
      scope,
    }),
    [groupId, config, role, scope],
  );

  // --- Orientation (data attribute for external styling) ---
  const orientation = config.navigate.orientation;

  // --- Render ---
  return (
    <FocusGroupContext.Provider value={contextValue}>
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is dynamic (listbox/toolbar/grid) */}
      <div
        ref={containerRef}
        id={groupId}
        data-focus-group={groupId}
        aria-current={isActive ? "true" : undefined}
        aria-orientation={
          config.navigate.orientation === "horizontal"
            ? "horizontal"
            : config.navigate.orientation === "vertical"
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
    </FocusGroupContext.Provider>
  );
}

FocusGroup.displayName = "FocusGroup";
