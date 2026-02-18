/**
 * defineApp — Bound component factories
 *
 * Creates Zone, Item, Field, When components for a zone binding.
 * Pure function — all dependencies passed as parameters.
 */

import { Field } from "@os/6-components/primitives/Field";
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
    const zoneProps: Record<string, unknown> = {
      id: id ?? zoneName,
      className,
      role: config.role,
    };

    // Map zone bindings → Zone event props
    const eventKeys = [
      "onCheck",
      "onAction",
      "onDelete",
      "onCopy",
      "onCut",
      "onPaste",
      "onMoveUp",
      "onMoveDown",
      "onUndo",
      "onRedo",
    ] as const;

    for (const key of eventKeys) {
      if (key in config) {
        const cmd = (config as Record<string, unknown>)[key];
        if (cmd) {
          zoneProps[key] = cmd;
        }
      }
    }

    // Forward advanced options (e.g., navigate override)
    if (config.options) {
      zoneProps.options = config.options;
    }

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
    blurOnInactive?: boolean;
  }> = (props) => {
    const fieldProps: Record<string, unknown> = { ...props };

    if (config.field) {
      // onChange/onSubmit: BaseCommand → FieldCommandFactory
      // Field expects (payload) => BaseCommand, but FieldBindings provides BaseCommand.
      // Wrap into a factory that merges { text } into the command's payload.
      if (config.field.onChange) {
        const cmd = config.field.onChange;
        fieldProps.onChange = (p: { text: string }) => ({
          ...cmd,
          payload: { ...(cmd.payload as Record<string, unknown>), ...p },
        });
      }
      if (config.field.onSubmit) {
        const cmd = config.field.onSubmit;
        fieldProps.onSubmit = (p: { text: string }) => ({
          ...cmd,
          payload: { ...(cmd.payload as Record<string, unknown>), ...p },
        });
      }
      if (config.field.onCancel) fieldProps.onCancel = config.field.onCancel;
    }

    return React.createElement(
      Field,
      fieldProps as React.ComponentProps<typeof Field>,
    );
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
