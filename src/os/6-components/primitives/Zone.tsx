/**
 * Zone - Facade for FocusGroup
 *
 * Provides a simplified wrapper for FocusGroup.
 * Configuration is primarily determined by the `role` prop.
 * Use `options` for advanced per-instance overrides when needed.
 */

import type { BaseCommand } from "@kernel";
import type { ZoneCallback } from "@os/2-contexts/zoneRegistry";
import { FocusGroup } from "@os/6-components/base/FocusGroup.tsx";
import type { ZoneRole } from "@os/registries/roleRegistry.ts";
import type {
  ActivateConfig,
  DismissConfig,
  NavigateConfig,
  ProjectConfig,
  SelectConfig,
  TabConfig,
} from "@os/schemas";
import type { ComponentProps, ReactNode } from "react";

/** Advanced configuration overrides - use sparingly, prefer role presets */
export interface ZoneOptions {
  navigate?: Partial<NavigateConfig>;
  tab?: Partial<TabConfig>;
  select?: Partial<SelectConfig>;
  activate?: Partial<ActivateConfig>;
  dismiss?: Partial<DismissConfig>;
  project?: Partial<ProjectConfig>;
}

// Zone only exposes role-based configuration - no manual config overrides
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
  return (
    <FocusGroup
      {...(id !== undefined ? { id } : {})}
      {...(role !== undefined ? { role } : {})}
      {...(options?.navigate !== undefined
        ? { navigate: options.navigate }
        : {})}
      {...(options?.tab !== undefined ? { tab: options.tab } : {})}
      {...(options?.select !== undefined ? { select: options.select } : {})}
      {...(options?.activate !== undefined
        ? { activate: options.activate }
        : {})}
      {...(options?.dismiss !== undefined ? { dismiss: options.dismiss } : {})}
      {...(options?.project !== undefined ? { project: options.project } : {})}
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
  );
}

// Re-export context hooks for convenience
export { useFocusGroupContext } from "@os/6-components/base/FocusGroup.tsx";
