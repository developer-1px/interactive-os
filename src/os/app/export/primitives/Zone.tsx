/**
 * Zone - Facade for FocusGroup
 *
 * Provides a simplified wrapper for FocusGroup.
 * Configuration is primarily determined by the `role` prop.
 * Use `options` for advanced per-instance overrides when needed.
 */

import type { BaseCommand } from "@/os-new/schema/command/BaseCommand";
import { FocusGroup } from "@/os-new/primitives/FocusGroup";
import type { ZoneRole } from "@/os-new/registry/roleRegistry";
import type {
  ActivateConfig,
  DismissConfig,
  NavigateConfig,
  ProjectConfig,
  SelectConfig,
  TabConfig,
} from "@os/features/focus/types";
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
  children,
  ...props
}: ZoneProps) {
  return (
    <FocusGroup
      id={id}
      role={role}
      navigate={options?.navigate}
      tab={options?.tab}
      select={options?.select}
      activate={options?.activate}
      dismiss={options?.dismiss}
      project={options?.project}
      onAction={onAction}
      onSelect={onSelect}
      onToggle={onToggle}
      onCopy={onCopy}
      onCut={onCut}
      onPaste={onPaste}
      onDelete={onDelete}
      onUndo={onUndo}
      onRedo={onRedo}
      {...props}
    >
      {children}
    </FocusGroup>
  );
}

// Re-export standard focus hooks and types for convenience
export * from "@/os-new/primitives/FocusGroup";
