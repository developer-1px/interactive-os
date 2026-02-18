/**
 * defineApp — Bound component factories
 *
 * Creates Zone, Item, Field, When components for a zone binding.
 * Pure function — all dependencies passed as parameters.
 */

import type { ZoneOptions } from "@os/6-components/primitives/Zone";
import { OS } from "@os/AntigravityOS";
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
    const zoneProps: Record<string, any> = {
      id: id ?? zoneName,
      className,
      role: config.role,
    };

    // Map zone bindings → OS.Zone event props
    const eventMap: Record<string, string> = {
      onCheck: "onCheck",
      onAction: "onAction",
      onDelete: "onDelete",
      onCopy: "onCopy",
      onCut: "onCut",
      onPaste: "onPaste",
      onMoveUp: "onMoveUp",
      onMoveDown: "onMoveDown",
      onUndo: "onUndo",
      onRedo: "onRedo",
    };

    for (const [declKey, propKey] of Object.entries(eventMap)) {
      const cmd = (config as any)[declKey];
      if (cmd) {
        zoneProps[propKey] = cmd;
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

    return React.createElement(OS.Zone, zoneProps as any, children);
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
      OS.Item,
      { id: String(id), className, asChild } as any,
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
    const fieldProps: Record<string, any> = { ...props };

    if (config.field) {
      if (config.field.onChange) fieldProps.onChange = config.field.onChange;
      if (config.field.onSubmit) fieldProps.onSubmit = config.field.onSubmit;
      if (config.field.onCancel) fieldProps.onCancel = config.field.onCancel;
    }

    return React.createElement(OS.Field, fieldProps as any);
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
