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
  useEffect,
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
  }) => void;

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
  containerRef?: React.RefObject<HTMLElement>;
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
    getItems?: (() => string[]) | undefined;
    getExpandableItems?: (() => Set<string>) | undefined;
    getTreeLevels?: (() => Map<string, number>) | undefined;
    onReorder?:
      | ((info: {
          itemId: string;
          overItemId: string;
          position: "before" | "after";
        }) => void)
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

  // --- Init kernel state (render-time, idempotent) ---
  // OS_ZONE_INIT is a no-op if zone already exists.
  // When used inside <Zone>, Zone dispatches this first.
  // When used standalone (rare), FocusGroup dispatches as fallback.
  useMemo(() => {
    os.dispatch(OS_ZONE_INIT(groupId));
  }, [groupId]);

  // --- Register in ZoneRegistry (DOM required) ---
  useLayoutEffect(() => {
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
          getItems: _getItems,
          getExpandableItems: _getExpandableItems,
          getTreeLevels: _getTreeLevels,
          onReorder: _onReorder,
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
    _getItems,
    _getExpandableItems,
    _getTreeLevels,
    _onReorder,
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
          os.dispatch(OS_FOCUS({ zoneId: groupId, itemId }));
        }
      } else {
        // No focusable items (e.g., dialog with only buttons, not FocusItems).
        // Still activate the zone to transfer activeZoneId.
        os.dispatch(OS_FOCUS({ zoneId: groupId, itemId: null }));
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [groupId, config.project.autoFocus]);

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
