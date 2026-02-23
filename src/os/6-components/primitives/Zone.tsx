/**
 * Zone — OS interaction jurisdiction.
 *
 * The composition point for all OS capabilities (Focus, DnD, Resize, ...).
 * Zone owns:
 *   - Zone ID generation
 *   - ZoneState initialization (OS_ZONE_INIT)
 *   - ZoneRegistry registration
 *   - ZoneContext (zoneId, scope)
 *   - App callback routing (onCopy, onDelete, onUndo, ...)
 *
 * Zone delegates APG composite widget behavior to FocusGroup (headless capability).
 *
 * Future capabilities (DnD, Resize) will be additional headless children of Zone,
 * composed in the same pattern as FocusGroup.
 */

import { type BaseCommand, defineScope, type ScopeToken } from "@kernel";
import type { ZoneCallback, ZoneEntry } from "@os/2-contexts/zoneRegistry";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OS_ZONE_INIT } from "@os/3-commands/focus";
import {
  FocusGroup,
  type ZoneContextValue,
  useZoneContext as _useZoneContext,
} from "@os/6-components/base/FocusGroup.tsx";
import type { ZoneRole } from "@os/registries/roleRegistry.ts";
import { os } from "@os/kernel.ts";
import type {
  ActivateConfig,
  DismissConfig,
  FocusGroupConfig,
  NavigateConfig,
  ProjectConfig,
  SelectConfig,
  TabConfig,
} from "@os/schemas";
import {
  createContext,
  type ComponentProps,
  type ReactNode,
  useContext,
  useLayoutEffect,
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
  /** Children */
  children: ReactNode;
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
  children,
  className,
  style,
  ...props
}: ZoneProps) {
  // ─── Zone ID (stable, auto-generated if not provided) ───
  const zoneId = useMemo(() => id || generateZoneId(), [id]);

  // ─── Scope (defaults to zoneId) ───
  const scope = useMemo(() => defineScope(zoneId), [zoneId]);

  // ─── Init kernel state (render-time, idempotent, SSR-safe) ───
  useMemo(() => {
    os.dispatch(OS_ZONE_INIT(zoneId));
  }, [zoneId]);

  // ─── ZoneContext value ───
  const zoneContextValue = useMemo<ZoneContextValue>(
    () => ({ zoneId, scope }),
    [zoneId, scope],
  );

  // ─── Render: Zone provides context, delegates to FocusGroup ───
  return (
    <ZoneContext.Provider value={zoneContextValue}>
      <FocusGroup
        id={zoneId}
        scope={scope}
        {...(role !== undefined ? { role } : {})}
        {...(options?.navigate !== undefined
          ? { navigate: options.navigate }
          : {})}
        {...(options?.tab !== undefined ? { tab: options.tab } : {})}
        {...(options?.select !== undefined ? { select: options.select } : {})}
        {...(options?.activate !== undefined
          ? { activate: options.activate }
          : {})}
        {...(options?.dismiss !== undefined
          ? { dismiss: options.dismiss }
          : {})}
        {...(options?.project !== undefined
          ? { project: options.project }
          : {})}
        {...(onAction !== undefined ? { onAction } : {})}
        {...(onSelect !== undefined ? { onSelect } : {})}
        {...(onCheck !== undefined ? { onCheck } : {})}
        {...(onCopy !== undefined ? { onCopy } : {})}
        {...(onCut !== undefined ? { onCut } : {})}
        {...(onPaste !== undefined ? { onPaste } : {})}
        {...(onDelete !== undefined ? { onDelete } : {})}
        {...(onMoveUp !== undefined ? { onMoveUp } : {})}
        {...(onMoveDown !== undefined ? { onMoveDown } : {})}
        {...(onUndo !== undefined ? { onUndo } : {})}
        {...(onRedo !== undefined ? { onRedo } : {})}
        {...(onDismiss !== undefined ? { onDismiss } : {})}
        {...(itemFilter !== undefined ? { itemFilter } : {})}
        {...(getItems !== undefined ? { getItems } : {})}
        {...(getExpandableItems !== undefined ? { getExpandableItems } : {})}
        {...(getTreeLevels !== undefined ? { getTreeLevels } : {})}
        {...(className !== undefined ? { className } : {})}
        {...(style !== undefined ? { style } : {})}
        {...props}
      >
        {children}
      </FocusGroup>
    </ZoneContext.Provider>
  );
}

// Re-export context hooks for convenience
export { useFocusGroupContext, useFocusContext } from "@os/6-components/base/FocusGroup.tsx";
