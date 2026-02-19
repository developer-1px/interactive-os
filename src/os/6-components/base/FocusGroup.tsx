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
import { type BaseCommand, defineScope, type ScopeToken } from "@kernel";
import { produce } from "immer";
import type { ZoneCallback, ZoneEntry } from "../../2-contexts/zoneRegistry.ts";
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
import { ZoneRegistry } from "../../2-contexts/zoneRegistry.ts";
import { FOCUS, STACK_POP, STACK_PUSH } from "../../3-commands/focus";
import { kernel } from "../../kernel.ts";
import { resolveRole, type ZoneRole } from "../../registries/roleRegistry.ts";
import type {
  ActivateConfig,
  DismissConfig,
  FocusGroupConfig,
  NavigateConfig,
  ProjectConfig,
  SelectConfig,
  TabConfig,
} from "../../schemas";

import { initialZoneState } from "../../state/initial.ts";

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
    | "onCheck"
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

  /** Kernel scope (for scoped command handlers). Defaults to groupId. */
  scope?: ScopeToken;

  /** Command dispatched when zone is dismissed (ESC with dismiss.escape: "close") */
  onDismiss?: BaseCommand;

  /** Dynamic item filter — controls which items are keyboard-navigable at runtime */
  itemFilter?: (items: string[]) => string[];

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

function buildZoneEntry(
  config: FocusGroupConfig,
  element: HTMLDivElement,
  props: {
    role?: ZoneRole | undefined;
    parentId: string | null;
    onDismiss?: BaseCommand | undefined;
    onAction?: ZoneCallback | undefined;
    onSelect?: ZoneCallback | undefined;
    onCheck?: ZoneCallback | undefined;
    onDelete?: ZoneCallback | undefined;
    onMoveUp?: ZoneCallback | undefined;
    onMoveDown?: ZoneCallback | undefined;
    onCopy?: ZoneCallback | undefined;
    onCut?: ZoneCallback | undefined;
    onPaste?: ZoneCallback | undefined;
    onUndo?: BaseCommand | undefined;
    onRedo?: BaseCommand | undefined;
    itemFilter?: ((items: string[]) => string[]) | undefined;
  },
): ZoneEntry {
  const entry: ZoneEntry = {
    config,
    element,
    parentId: props.parentId,
  };
  if (props.role !== undefined) entry.role = props.role;
  if (props.onDismiss !== undefined) entry.onDismiss = props.onDismiss;
  if (props.onAction !== undefined) entry.onAction = props.onAction;
  if (props.onSelect !== undefined) entry.onSelect = props.onSelect;
  if (props.onCheck !== undefined) entry.onCheck = props.onCheck;
  if (props.onDelete !== undefined) entry.onDelete = props.onDelete;
  if (props.onMoveUp !== undefined) entry.onMoveUp = props.onMoveUp;
  if (props.onMoveDown !== undefined) entry.onMoveDown = props.onMoveDown;
  if (props.onCopy !== undefined) entry.onCopy = props.onCopy;
  if (props.onCut !== undefined) entry.onCut = props.onCut;
  if (props.onPaste !== undefined) entry.onPaste = props.onPaste;
  if (props.onUndo !== undefined) entry.onUndo = props.onUndo;
  if (props.onRedo !== undefined) entry.onRedo = props.onRedo;
  if (props.itemFilter !== undefined) entry.itemFilter = props.itemFilter;
  return entry;
}

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
  onCheck: _onCheck,
  onDelete: _onDelete,
  onMoveUp: _onMoveUp,
  onMoveDown: _onMoveDown,
  onUndo: _onUndo,
  onRedo: _onRedo,
  onDismiss,
  itemFilter: _itemFilter,
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
      ZoneRegistry.register(
        groupId,
        buildZoneEntry(config, containerRef.current, {
          role,
          parentId,
          onDismiss,
          onAction: _onAction,
          onSelect: _onSelect,
          onCheck: _onCheck,
          onDelete: _onDelete,
          onMoveUp: _onMoveUp,
          onMoveDown: _onMoveDown,
          onCopy: _onCopy,
          onCut: _onCut,
          onPaste: _onPaste,
          onUndo: _onUndo,
          onRedo: _onRedo,
          itemFilter: _itemFilter,
        }),
      );
    }

    return () => {
      ZoneRegistry.unregister(groupId);
    };
  }, [
    groupId,
    config,
    role,
    parentId,
    onDismiss,
    _onAction,
    _onSelect,
    _onCheck,
    _onDelete,
    _onMoveUp,
    _onMoveDown,
    _onCopy,
    _onCut,
    _onPaste,
    _onUndo,
    _onRedo,
    _itemFilter,
  ]);

  // --- AutoFocus: focus first item on mount when config.project.autoFocus ---
  useEffect(() => {
    if (!config.project.autoFocus) return;
    if (!containerRef.current) return;

    // Wait one frame for children to render
    const raf = requestAnimationFrame(() => {
      if (!containerRef.current) return;
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
  useLayoutEffect(() => {
    if (!config.project.autoFocus) return;
    kernel.dispatch(STACK_PUSH());
    return () => {
      kernel.dispatch(STACK_POP());
    };
  }, [config.project.autoFocus]);

  // --- Is Active ---
  const isActive = kernel.useComputed(
    (s) => s.os.focus.activeZoneId === groupId,
  );

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
