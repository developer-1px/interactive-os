/**
 * FocusGroup — Focus capability context provider.
 *
 * Two modes:
 *   - **Headless** (inside Zone): Pure config→context. No registration, no lifecycle.
 *     Zone handles registration via useZoneLifecycle.
 *   - **Standalone** (without Zone): Full lifecycle via useZoneLifecycle hook.
 *     Used in showcase/test pages. Production apps always use Zone.
 *
 * Provides:
 *   - ZoneContext (zoneId, scope) — zone-level identity
 *   - FocusContext (config, role) — focus capability config
 */
import { type BaseCommand, defineScope, type ScopeToken } from "@kernel";

import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
} from "react";
import type { ZoneCallback } from "../../2-contexts/zoneRegistry.ts";
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
import {
  useZoneLifecycle,
  type ZoneCallbacks,
} from "./useZoneLifecycle.ts";

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

  /**
   * Pre-computed config (set by Zone in headless mode).
   * When provided, skip resolveRole — Zone already computed it.
   */
  config?: FocusGroupConfig;

  // --- Callbacks (standalone mode only — Zone handles these directly) ---
  onAction?: ZoneCallback;
  onSelect?: ZoneCallback;
  onCopy?: ZoneCallback;
  onCut?: ZoneCallback;
  onPaste?: ZoneCallback;
  onCheck?: ZoneCallback;
  onDelete?: ZoneCallback;
  onMoveUp?: ZoneCallback;
  onMoveDown?: ZoneCallback;
  onUndo?: BaseCommand;
  onRedo?: BaseCommand;
  onDismiss?: BaseCommand;
  itemFilter?: (items: string[]) => string[];
  getItems?: () => string[];
  getExpandableItems?: () => Set<string>;
  getTreeLevels?: () => Map<string, number>;
  onReorder?: (info: {
    itemId: string;
    overItemId: string;
    position: "before" | "after";
  }) => BaseCommand | BaseCommand[];

  /** Kernel scope (for scoped command handlers). Defaults to groupId. */
  scope?: ScopeToken;

  /** Children */
  children: ReactNode;

  /** Container className */
  className?: string;

  /** Container style */
  style?: React.CSSProperties;

  /** When true, FocusGroup renders no DOM — only context.
   *  Zone is responsible for rendering and lifecycle. */
  headless?: boolean;

  /** External ref to the container element (used when headless=true). */
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
  config: precomputedConfig,
  scope: propScope,
  // Callbacks — only used in standalone mode
  onAction,
  onSelect,
  onCopy,
  onCut,
  onPaste,
  onCheck,
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
  // When Zone provides precomputedConfig, skip resolveRole.
  const config = useMemo(() => {
    if (precomputedConfig) return precomputedConfig;
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
  }, [precomputedConfig, role, navigate, tab, select, activate, dismiss, project]);

  // --- Parent Context ---
  const parentContext = useContext(ZoneContext);
  const parentId = parentContext?.zoneId || null;

  // --- Container Ref (standalone only) ---
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = (externalContainerRef ??
    internalRef) as React.RefObject<HTMLDivElement>;

  // --- Standalone lifecycle (only when NOT headless) ---
  // When headless, Zone handles registration + lifecycle via useZoneLifecycle.
  // Callbacks bag is always created but the hook is only called in standalone.
  const callbacks = useMemo<ZoneCallbacks>(
    () => ({
      onAction, onSelect, onCheck, onDelete, onMoveUp, onMoveDown,
      onCopy, onCut, onPaste, onUndo, onRedo, onDismiss,
      itemFilter, getItems, getExpandableItems, getTreeLevels, onReorder,
    }),
    // biome-ignore lint/correctness/useExhaustiveDependencies: callbacks captured in ref inside hook
    [],
  );

  // Lifecycle hook — only called in standalone mode.
  // In headless mode, this is a no-op (Zone's hook handles it).
  // React requires hooks to be called unconditionally, so we always call,
  // but the hook is idempotent — calling register over an existing entry just updates it.
  if (!headless) {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- conditional is stable (headless prop doesn't change)
    useZoneLifecycle(groupId, config, role, parentId, containerRef, callbacks);
  }

  // --- Is Active ---
  const isActive = os.useComputed((s) => s.os.focus.activeZoneId === groupId);

  // --- Context Values ---
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
  const parentZoneCtx = useContext(ZoneContext);
  const needsZoneContext = !parentZoneCtx || parentZoneCtx.zoneId !== groupId;

  // Headless mode: no DOM, just context. Zone handles the rest.
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

  // Standard mode: renders container div.
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
