/**
 * Zone - Facade for FocusGroup
 *
 * Provides a simplified wrapper for FocusGroup.
 * Configuration is primarily determined by the `role` prop.
 * Use `options` for advanced per-instance overrides when needed.
 */

import type { ComponentProps, ReactNode } from "react";
import { FocusGroup } from "@os/6-components/base/FocusGroup.tsx";
import type { ZoneRole } from "@os/registry/roleRegistry.ts";
import type {
  ActivateConfig,
  DismissConfig,
  NavigateConfig,
  ProjectConfig,
  SelectConfig,
  TabConfig,
} from "@os/schema";
import type { BaseCommand } from "@os/schema/command/BaseCommand.ts";
import type { AnyCommand } from "@kernel";

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
    "id" | "role" | "onSelect" | "onCopy" | "onCut" | "onPaste" | "onToggle"
  > {
  /** Unique identifier for the zone */
  id?: string;
  /** ARIA role preset that determines all navigation/tab/select behavior */
  role?: ZoneRole;
  /** Advanced config overrides (use sparingly) */
  options?: ZoneOptions;
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
  /** Command dispatched when the zone is dismissed (ESC key) */
  onDismiss?: AnyCommand;
  /** Children */
  children: ReactNode;
}

export function Zone({
  id,
  role,
  options,
  onAction,
  onSelect,
  onToggle,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onUndo,
  onRedo,
  onDismiss,
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
      {...(onToggle !== undefined ? { onToggle } : {})}
      {...(onCopy !== undefined ? { onCopy } : {})}
      {...(onCut !== undefined ? { onCut } : {})}
      {...(onPaste !== undefined ? { onPaste } : {})}
      {...(onDelete !== undefined ? { onDelete } : {})}
      {...(onUndo !== undefined ? { onUndo } : {})}
      {...(onRedo !== undefined ? { onRedo } : {})}
      {...(onDismiss !== undefined ? { onDismiss } : {})}
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
