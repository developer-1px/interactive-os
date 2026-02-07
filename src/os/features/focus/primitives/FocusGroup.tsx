import type { BaseCommand } from "@os/entities/BaseCommand";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
} from "react";
import { FocusData } from "../lib/focusData";
import { useIsFocusedGroup } from "../hooks/useIsFocusedGroup";
import { resolveRole, type ZoneRole } from "../registry/roleRegistry";
import {
  type FocusGroupStore,
  useFocusGroupStoreInstance,
} from "../store/focusGroupStore";
import type {
  ActivateConfig,
  DismissConfig,
  FocusGroupConfig,
  NavigateConfig,
  ProjectConfig,
  SelectConfig,
  TabConfig,
} from "../types";

// ═══════════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════════

interface FocusGroupContextValue {
  groupId: string;
  store: FocusGroupStore;
  config: FocusGroupConfig;
  zoneRole?: ZoneRole;
}

const FocusGroupContext = createContext<FocusGroupContextValue | null>(null);

export function useFocusGroupContext() {
  return useContext(FocusGroupContext);
}

export function useFocusGroupStore() {
  const ctx = useContext(FocusGroupContext);
  if (!ctx) {
    throw new Error("useFocusGroupStore must be used within a FocusGroup");
  }
  return ctx.store;
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

// W3C: Only the first autoFocus group in DOM order should receive focus
let autoFocusClaimed = false;

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
  onAction,
  onSelect,
  onCopy,
  onCut,
  onPaste,
  onToggle,
  onDelete,
  onUndo,
  onRedo,
  children,
  className,
  style,
  ...rest
}: FocusGroupProps) {
  // --- Stable ID ---
  const groupId = useMemo(() => propId || generateGroupId(), [propId]);

  // --- Scoped Store (Persistent across Remounts) ---
  const store = useFocusGroupStoreInstance(groupId);

  // --- Resolve Configuration ---
  const config = useMemo(() => {
    return resolveRole(role, {
      navigate,
      tab,
      select,
      activate,
      dismiss,
      project,
    });
  }, [role, navigate, tab, select, activate, dismiss, project]);

  // --- Parent Context ---
  const parentContext = useContext(FocusGroupContext);
  const parentId = parentContext?.groupId || null;

  // --- Container Ref for FocusData ---
  const containerRef = useMemo(
    () => ({ current: null as HTMLDivElement | null }),
    [],
  );

  // --- FocusData Registration (WeakMap) ---
  useLayoutEffect(() => {
    if (containerRef.current) {
      FocusData.set(containerRef.current, {
        store,
        config,
        parentId,
        activateCommand: onAction,
        selectCommand: onSelect,
        copyCommand: onCopy,
        cutCommand: onCut,
        pasteCommand: onPaste,
        deleteCommand: onDelete,
        toggleCommand: onToggle,
        undoCommand: onUndo,
        redoCommand: onRedo,
      });
    }
    // No cleanup needed - WeakMap auto-GC when element is removed
  }, [
    store,
    config,
    parentId,
    onAction,
    onSelect,
    onCopy,
    onCut,
    onPaste,
    onToggle,
    onDelete,
    onUndo,
    onRedo,
  ]);

  // --- Auto-Focus for Dialog/Modal or explicit autoFocus ---
  // W3C spec: only the first autofocus element in DOM order receives focus.
  // Dialog/alertdialog always gets focus (modal override).
  useLayoutEffect(() => {
    const isModal = role === "dialog" || role === "alertdialog";
    const shouldAutoFocus = config.project?.autoFocus || isModal;
    if (!shouldAutoFocus) return;
    if (!isModal && autoFocusClaimed) return; // W3C: first wins
    if (!containerRef.current) return;

    // Find first focusable item in the group
    const firstItem = containerRef.current.querySelector(
      "[data-focus-item]",
    ) as HTMLElement;
    if (firstItem) {
      if (!isModal) autoFocusClaimed = true;
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        firstItem.focus({ preventScroll: true });
        store.setState({ focusedItemId: firstItem.id });
      });
    }
  }, [role, store, config.project?.autoFocus]);

  // --- Context Value ---
  const contextValue = useMemo<FocusGroupContextValue>(
    () => ({
      groupId,
      store,
      config,
      zoneRole: role,
    }),
    [groupId, store, config, role],
  );

  // --- Orientation (data attribute for external styling) ---
  const orientation = config.navigate.orientation;

  // --- Render ---
  return (
    <FocusGroupContext.Provider value={contextValue}>
      <div
        ref={(el) => {
          containerRef.current = el;
        }}
        id={groupId}
        data-focus-group={groupId}
        aria-current={useIsFocusedGroup(groupId) ? "true" : undefined}
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
        onFocusCapture={() => {
          // Set this zone as active when any child receives focus
          FocusData.setActiveZone(groupId);
        }}
        className={className || undefined}
        data-orientation={orientation}
        style={{ outline: 'none', ...style }}
        {...rest}
      >
        {children}
      </div>
    </FocusGroupContext.Provider>
  );
}

FocusGroup.displayName = "FocusGroup";
