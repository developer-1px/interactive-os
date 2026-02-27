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

import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,

  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import type { ZoneCallback, ZoneEntry } from "../../2-contexts/zoneRegistry.ts";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry.ts";
import {
  OS_FOCUS,
  OS_STACK_POP,
  OS_STACK_PUSH,
  OS_ZONE_INIT,
} from "../../3-commands/focus";
import { os } from "../../kernel.ts";
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
import { DEFAULT_CONFIG } from "../../schemas";

// ═══════════════════════════════════════════════════════════════════
// ZoneContext — Zone-level identity (consumed by all capabilities)
// ═══════════════════════════════════════════════════════════════════

export interface ZoneContextValue {
  zoneId: string;
  scope: ScopeToken;
}

const ZoneContext = createContext<ZoneContextValue | null>(null);

/** Read zone-level identity (zoneId, scope). Usable by any capability. */
export function useZoneContext() {
  return useContext(ZoneContext);
}

// ═══════════════════════════════════════════════════════════════════
// FocusContext — Focus capability (consumed by FocusItem, etc.)
// ═══════════════════════════════════════════════════════════════════

export interface FocusContextValue {
  config: FocusGroupConfig;
  role?: ZoneRole;
}

const FocusContext = createContext<FocusContextValue | null>(null);

/** Read focus capability config (FocusGroupConfig, role). */
export function useFocusContext() {
  return useContext(FocusContext);
}

// ═══════════════════════════════════════════════════════════════════
// Legacy: FocusGroupContext (backward-compatible composite)
// ═══════════════════════════════════════════════════════════════════

/** @deprecated Use useZoneContext() + useFocusContext() instead. */
export interface FocusGroupContextValue {
  zoneId: string;
  config: FocusGroupConfig;
  zoneRole?: ZoneRole;
  scope: ScopeToken;
}

/**
 * @deprecated Use useZoneContext() + useFocusContext() instead.
 * Backward-compatible composite that merges both contexts.
 */
export function useFocusGroupContext(): FocusGroupContextValue | null {
  const zone = useContext(ZoneContext);
  const focus = useContext(FocusContext);
  if (!zone) return null;
  return {
    zoneId: zone.zoneId,
    scope: zone.scope,
    config: focus?.config ?? DEFAULT_CONFIG,
    ...(focus?.role !== undefined ? { zoneRole: focus.role } : {}),
  };
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

  /** Item accessor — returns ordered item IDs for stale focus recovery */
  getItems?: () => string[];

  /** Expandable item accessor — returns IDs of expandable items */
  getExpandableItems?: () => Set<string>;

  /** Tree level accessor — returns map of item ID → level */
  getTreeLevels?: () => Map<string, number>;

  /** Drag reorder callback — invoked by OS_DRAG_END when an item is dropped */
  onReorder?: (info: {
    itemId: string;
    overItemId: string;
    position: "before" | "after";
  }) => BaseCommand | BaseCommand[];

  /** Children */
  children: ReactNode;

  /** Container className */
  className?: string;

  /** Container style */
  style?: React.CSSProperties;

  /** When true, FocusGroup renders no DOM — only context + effects.
   *  The parent (Zone) is responsible for rendering the container element. */
  headless?: boolean;

  /** External ref to the container element (used when headless=true).
   *  Zone passes this so FocusGroup can register with ZoneRegistry and run autoFocus. */
  containerRef?: React.RefObject<HTMLElement | null>;
}

// ═══════════════════════════════════════════════════════════════════
// ID Generator
// ═══════════════════════════════════════════════════════════════════

let groupIdCounter = 0;
function generateGroupId() {
  return `focus-group-${++groupIdCounter}`;
}

// ═══════════════════════════════════════════════════════════════════
// Init helper — dispatches OS_ZONE_INIT if no parent Zone provides context.
// When used inside <Zone>, Zone already dispatches OS_ZONE_INIT.
// When used standalone, FocusGroup must init itself.
// ═══════════════════════════════════════════════════════════════════

function buildZoneEntry(
  config: FocusGroupConfig,
  element: HTMLDivElement | null,
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
    getItems?: (() => string[]) | undefined;
    getExpandableItems?: (() => Set<string>) | undefined;
    getTreeLevels?: (() => Map<string, number>) | undefined;
    onReorder?:
    | ((info: {
      itemId: string;
      overItemId: string;
      position: "before" | "after";
    }) => BaseCommand | BaseCommand[])
    | undefined;
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
  if (props.getItems !== undefined) entry.getItems = props.getItems;
  if (props.getExpandableItems !== undefined)
    entry.getExpandableItems = props.getExpandableItems;
  if (props.getTreeLevels !== undefined)
    entry.getTreeLevels = props.getTreeLevels;
  if (props.onReorder !== undefined) entry.onReorder = props.onReorder;
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
  getItems: _getItems,
  getExpandableItems: _getExpandableItems,
  getTreeLevels: _getTreeLevels,
  onReorder: _onReorder,
  children,
  className,
  style,
  headless = false,
  containerRef: externalContainerRef,
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
  const parentContext = useContext(ZoneContext);
  const parentId = parentContext?.zoneId || null;

  // --- Container Ref ---
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = (externalContainerRef ??
    internalRef) as React.RefObject<HTMLDivElement>;

  // --- Refs for callbacks (avoid deps churn in the unified effect) ---
  const callbacksRef = useRef({
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
    onReorder: _onReorder,
    onDismiss,
    itemFilter: _itemFilter,
    getItems: _getItems,
    getExpandableItems: _getExpandableItems,
    getTreeLevels: _getTreeLevels,
  });
  callbacksRef.current = {
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
    onReorder: _onReorder,
    onDismiss,
    itemFilter: _itemFilter,
    getItems: _getItems,
    getExpandableItems: _getExpandableItems,
    getTreeLevels: _getTreeLevels,
  };

  // --- Logical registration (render-time, headless-safe) ---
  // ZoneRegistry.register is a pure Map.set — no re-render triggered.
  // Safe in useMemo. This enables renderToString (headless) to access zone config.
  //
  // CRITICAL: Preserve DOM bindings from bindElement (useLayoutEffect).
  // Without this, re-execution wipes auto-generated getItems/getLabels/element.
  useMemo(() => {
    const existing = ZoneRegistry.get(groupId);
    const cb = callbacksRef.current;
    const entry = buildZoneEntry(config, null, {
      role,
      parentId,
      onDismiss: cb.onDismiss,
      onAction: cb.onAction,
      onSelect: cb.onSelect,
      onCheck: cb.onCheck,
      onDelete: cb.onDelete,
      onMoveUp: cb.onMoveUp,
      onMoveDown: cb.onMoveDown,
      onCopy: cb.onCopy,
      onCut: cb.onCut,
      onPaste: cb.onPaste,
      onUndo: cb.onUndo,
      onRedo: cb.onRedo,
      itemFilter: cb.itemFilter,
      getItems: cb.getItems,
      getExpandableItems: cb.getExpandableItems,
      getTreeLevels: cb.getTreeLevels,
      onReorder: cb.onReorder,
    });

    // Preserve DOM bindings from bindElement
    if (existing?.element) entry.element = existing.element;
    if (!cb.getItems && existing?.getItems) entry.getItems = existing.getItems;
    if (!entry.getLabels && existing?.getLabels) entry.getLabels = existing.getLabels;

    ZoneRegistry.register(groupId, entry);
  }, [groupId, config, role, parentId]);

  // --- Commit phase: dispatch + DOM binding (safe from render loops) ---
  // All os.dispatch() calls MUST be in useLayoutEffect, NOT useMemo.
  // useMemo dispatch → state change → re-render → useMemo → dispatch → ∞
  useLayoutEffect(() => {
    // 1. Init kernel state (idempotent — no-op if zone already exists)
    os.dispatch(OS_ZONE_INIT(groupId));

    // 2. Bind DOM element — auto-creates getItems/getLabels if not explicit
    if (containerRef.current) {
      ZoneRegistry.bindElement(groupId, containerRef.current);
    }

    // 3. AutoFocus
    if (config.project.autoFocus) {
      const registered = ZoneRegistry.get(groupId);
      const items = registered?.getItems?.() ?? [];
      const firstItemId = items[0] ?? null;
      os.dispatch(OS_FOCUS({ zoneId: groupId, itemId: firstItemId }));
    }

    return () => {
      ZoneRegistry.unregister(groupId);
    };
  }, [groupId, config, role, parentId]);

  // --- Auto Focus Stack for dialog/alertdialog ---
  // When autoFocus is true, push focus stack on mount and pop on unmount
  useLayoutEffect(() => {
    if (!config.project.autoFocus) return;
    os.dispatch(OS_STACK_PUSH());
    return () => {
      os.dispatch(OS_STACK_POP());
    };
  }, [config.project.autoFocus]);

  // --- Is Active ---
  const isActive = os.useComputed((s) => s.os.focus.activeZoneId === groupId);

  // --- Context Values (separated) ---
  const zoneContextValue = useMemo<ZoneContextValue>(
    () => ({ zoneId: groupId, scope }),
    [groupId, scope],
  );

  const focusContextValue = useMemo<FocusContextValue>(
    () => ({
      config,
      ...(role !== undefined ? { role } : {}),
    }),
    [config, role],
  );

  // --- Orientation (data attribute for external styling) ---
  const orientation = config.navigate.orientation;

  // --- Render ---
  // If inside a <Zone>, ZoneContext is already provided by Zone.
  // If standalone, FocusGroup provides its own ZoneContext.
  const parentZoneCtx = useContext(ZoneContext);
  const needsZoneContext = !parentZoneCtx || parentZoneCtx.zoneId !== groupId;

  // Headless mode: no DOM, just context + effects.
  // Zone handles rendering the container element and applying props.
  if (headless) {
    const headlessContent = (
      <FocusContext.Provider value={focusContextValue}>
        {children}
      </FocusContext.Provider>
    );

    if (needsZoneContext) {
      return (
        <ZoneContext.Provider value={zoneContextValue}>
          {headlessContent}
        </ZoneContext.Provider>
      );
    }

    return headlessContent;
  }

  // Standard mode: FocusGroup renders its own container div.
  const content = (
    <FocusContext.Provider value={focusContextValue}>
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is dynamic (listbox/toolbar/grid) */}
      <div
        ref={internalRef}
        id={groupId}
        data-zone={groupId}
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
    </FocusContext.Provider>
  );

  if (needsZoneContext) {
    return (
      <ZoneContext.Provider value={zoneContextValue}>
        {content}
      </ZoneContext.Provider>
    );
  }

  return content;
}

FocusGroup.displayName = "FocusGroup";
