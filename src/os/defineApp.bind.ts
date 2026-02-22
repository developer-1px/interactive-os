/**
 * defineApp — Bound component factories
 *
 * Creates Zone, Item, Field, When components for a zone binding.
 * Pure function — all dependencies passed as parameters.
 */

import { Field } from "@os/6-components/field/Field";
import { Item } from "@os/6-components/primitives/Item";
import type { ZoneOptions } from "@os/6-components/primitives/Zone";
import { Zone } from "@os/6-components/primitives/Zone";
import { Keybindings as KeybindingsRegistry } from "@os/keymaps/keybindings";
import React, { type ReactNode } from "react";
import type {
  BoundComponents,
  Condition,
  FieldBindings,
  KeybindingEntry,
  ZoneBindings,
} from "./defineApp.types";

// ═══════════════════════════════════════════════════════════════════
// Bind Config (injected by createZone)
// ═══════════════════════════════════════════════════════════════════

export interface BindConfig<S> {
  appId: string;
  zoneName: string;
  useComputed: <T>(fn: (s: S) => T) => T;
}

// ═══════════════════════════════════════════════════════════════════
// createBoundComponents — Pure function
// ═══════════════════════════════════════════════════════════════════

export function createBoundComponents<S>(
  bindConfig: BindConfig<S>,
  config: ZoneBindings & {
    field?: FieldBindings;
    keybindings?: KeybindingEntry<S>[];
    options?: ZoneOptions;
    itemFilter?: (items: string[]) => string[];
    getItems?: () => string[];
    getExpandableItems?: () => Set<string>;
    getTreeLevels?: () => Map<string, number>;
  },
): BoundComponents<S> {
  const { appId, zoneName, useComputed } = bindConfig;

  // ── Zone component ──
  const ZoneComponent: React.FC<{
    className?: string;
    children?: ReactNode;
    "aria-label"?: string;
  }> = ({ className, children, ...rest }) => {
    // Zone ID is always auto-injected from bind() — not developer-specified
    const zoneProps: any = {
      ...rest,
      id: zoneName,
      className,
      role: config.role,
      onCheck: config.onCheck,
      onAction: config.onAction,
      onSelect: config.onSelect,
      onDelete: config.onDelete,
      onCopy: config.onCopy,
      onCut: config.onCut,
      onPaste: config.onPaste,
      onMoveUp: config.onMoveUp,
      onMoveDown: config.onMoveDown,
      onUndo: config.onUndo,
      onRedo: config.onRedo,
      options: config.options,
      itemFilter: config.itemFilter,
      getItems: config.getItems,
      getExpandableItems: config.getExpandableItems,
      getTreeLevels: config.getTreeLevels,
    };

    // Keybindings registration
    React.useEffect(() => {
      if (!config.keybindings || config.keybindings.length === 0) return;
      const bindings = config.keybindings.map((kb) => ({
        key: kb.key,
        command: kb.command,
        when: "navigating" as const,
      }));
      return KeybindingsRegistry.registerAll(bindings);
    }, []);

    return React.createElement(
      Zone,
      zoneProps as React.ComponentProps<typeof Zone>,
      children,
    );
  };
  ZoneComponent.displayName = `${appId}.${zoneName}.Zone`;

  // ── Item component ──
  const ItemComponent: React.FC<{
    id: string | number;
    className?: string;
    children?: ReactNode;
    asChild?: boolean;
  }> = ({ id, className, children, asChild }) => {
    return React.createElement(
      Item,
      { id: String(id), className, asChild } as React.ComponentProps<
        typeof Item
      >,
      children,
    );
  };
  ItemComponent.displayName = `${appId}.${zoneName}.Item`;

  // ── Field component ──
  const FieldComponent: React.FC<{
    name: string;
    value?: string;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
    mode?: import("@os/6-components/field/Field").FieldMode;
    fieldType?: import("@os/6-components/field/FieldRegistry").FieldType;
  }> = (props) => {
    const fieldConfig = config.field;

    return React.createElement(Field, {
      ...props,
      ...(fieldConfig?.onCommit ? { onCommit: fieldConfig.onCommit } : {}),
      ...(fieldConfig?.trigger ? { trigger: fieldConfig.trigger } : {}),
      ...(fieldConfig?.schema ? { schema: fieldConfig.schema } : {}),
      ...(fieldConfig?.resetOnSubmit
        ? { resetOnSubmit: fieldConfig.resetOnSubmit }
        : {}),
      ...(fieldConfig?.onCancel ? { onCancel: fieldConfig.onCancel } : {}),
    } as React.ComponentProps<typeof Field>);
  };
  FieldComponent.displayName = `${appId}.${zoneName}.Field`;

  // ── When component ──
  const WhenComponent: React.FC<{
    condition: Condition<S>;
    children?: ReactNode;
  }> = ({ condition, children }) => {
    const value = useComputed((s) => condition.evaluate(s));
    return value ? React.createElement(React.Fragment, null, children) : null;
  };
  WhenComponent.displayName = `${appId}.${zoneName}.When`;

  return {
    Zone: ZoneComponent,
    Item: ItemComponent,
    Field: FieldComponent,
    When: WhenComponent,
  };
}
