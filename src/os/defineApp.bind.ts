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
  },
): BoundComponents<S> {
  const { appId, zoneName, useComputed } = bindConfig;

  // ── Zone component ──
  const ZoneComponent: React.FC<{
    id?: string;
    className?: string;
    children?: ReactNode;
  }> = ({ id, className, children }) => {
    // Explicit prop mapping — no runtime loop, no Record<string, unknown> cast
    const zoneProps: React.ComponentProps<typeof Zone> = {
      id: id ?? zoneName,
      className,
      role: config.role,
      onCheck: config.onCheck,
      onAction: config.onAction,
      onDelete: config.onDelete,
      onCopy: config.onCopy,
      onCut: config.onCut,
      onPaste: config.onPaste,
      onMoveUp: config.onMoveUp,
      onMoveDown: config.onMoveDown,
      onUndo: config.onUndo,
      onRedo: config.onRedo,
      options: config.options,
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

    return React.createElement(Zone, zoneProps, children);
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
    blurOnInactive?: boolean;
  }> = (props) => {
    const fieldConfig = config.field;

    // Build typed onChange/onSubmit factories that merge { text } into payload
    const onChange = fieldConfig?.onChange
      ? (p: { text: string }) => ({
        ...fieldConfig.onChange!,
        payload: { ...fieldConfig.onChange!.payload, ...p },
      })
      : undefined;

    const onSubmit = fieldConfig?.onSubmit
      ? (p: { text: string }) => ({
        ...fieldConfig.onSubmit!,
        payload: { ...fieldConfig.onSubmit!.payload, ...p },
      })
      : undefined;

    return React.createElement(Field, {
      ...props,
      onChange,
      onSubmit,
      onCommit: fieldConfig?.onCommit,
      trigger: fieldConfig?.trigger,
      schema: fieldConfig?.schema,
      resetOnSubmit: fieldConfig?.resetOnSubmit,
      onCancel: fieldConfig?.onCancel,
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
