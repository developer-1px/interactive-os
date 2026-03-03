/**
 * defineApp — Bound component factories
 *
 * Creates Zone, Item, Field, When components for a zone binding.
 * Pure function — all dependencies passed as parameters.
 */

import { Keybindings as KeybindingsRegistry } from "@os-core/2-resolve/keybindings";
import { os } from "@os-core/engine/kernel";
import {
  getContentRole,
  getContentVisibilitySource,
} from "@os-core/engine/registries/roleRegistry";
import { Field } from "@os-react/6-project/field/Field";
import { Item } from "@os-react/6-project/Item";
import type { ZoneOptions } from "@os-react/6-project/Zone";
import { useZoneContext, Zone } from "@os-react/6-project/Zone";
import React, { type ReactNode } from "react";
import type {
  BoundComponents,
  Condition,
  FieldBindings,
  KeybindingEntry,
  ZoneBindings,
} from "./types";

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
    onReorder?: (info: {
      itemId: string;
      overItemId: string;
      position: "before" | "after";
    }) => void;
  },
): BoundComponents<S> {
  const { appId, zoneName, useComputed } = bindConfig;

  // ── Zone component ──
  const ZoneComponent: React.FC<{
    id?: string;
    className?: string;
    children?: ReactNode;
    "aria-label"?: string;
    getExpandableItems?: () => Set<string>;
  }> = ({ className, children, ...rest }) => {
    // Zone ID is always auto-injected from bind() — not developer-specified
    // JSX props (...rest) provide base callbacks; config overrides only when defined.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic zone props from config
    const zoneProps: any = {
      id: zoneName,
      className,
      role: config.role,
      options: config.options,
      itemFilter: config.itemFilter,
      getItems: config.getItems,
      getExpandableItems: config.getExpandableItems,
      getTreeLevels: config.getTreeLevels,
      onReorder: config.onReorder,
      ...rest,
      ...(config.onCheck ? { onCheck: config.onCheck } : {}),
      ...(config.onAction ? { onAction: config.onAction } : {}),
      ...(config.onSelect ? { onSelect: config.onSelect } : {}),
      ...(config.onDelete ? { onDelete: config.onDelete } : {}),
      ...(config.onCopy ? { onCopy: config.onCopy } : {}),
      ...(config.onCut ? { onCut: config.onCut } : {}),
      ...(config.onPaste ? { onPaste: config.onPaste } : {}),
      ...(config.onMoveUp ? { onMoveUp: config.onMoveUp } : {}),
      ...(config.onMoveDown ? { onMoveDown: config.onMoveDown } : {}),
      ...(config.onUndo ? { onUndo: config.onUndo } : {}),
      ...(config.onRedo ? { onRedo: config.onRedo } : {}),
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
    children?:
      | ReactNode
      | ((state: {
          isFocused: boolean;
          isSelected: boolean;
          isExpanded: boolean;
          isAnchor?: boolean;
        }) => ReactNode);
    asChild?: boolean;
  }> & {
    Region: React.FC<{
      for: string;
      id?: string;
      className?: string;
      children?: ReactNode;
    }>;
  } = ({ id, className, children, asChild }) => {
    return React.createElement(Item, {
      id: String(id),
      className,
      asChild,
      children,
    } as React.ComponentProps<typeof Item>);
  };
  ItemComponent.displayName = `${appId}.${zoneName}.Item`;

  // ── Item.Content — passive projection of Item's visibility state ──
  // Automatically uses expandedItems (accordion) or selectedItems (tablist)
  // based on Zone role. ARIA role and tabindex also determined by Zone role.
  const ContentComponent: React.FC<{
    for: string;
    id?: string;
    className?: string;
    children?: ReactNode;
  }> = ({ for: itemId, id, className, children }) => {
    // Always use zoneName from bind config — NOT useZoneContext().
    // Item.Content often renders outside its Zone (e.g. tabpanel outside tablist),
    // so useZoneContext() would return a parent zone (e.g. os-shell), not ours.
    const zoneId = zoneName;
    const zoneRole = config.role;

    const visibilitySource = getContentVisibilitySource(zoneRole);
    const contentRole = getContentRole(zoneRole);
    const useHiddenAttribute = visibilitySource === "selected";

    const isVisible = os.useComputed((s) => {
      const zone = s.os.focus.zones[zoneId];
      if (visibilitySource === "selected") {
        return zone?.selection?.includes(itemId) ?? false;
      }
      if (!zone) return false;
      return zone.expandedItems?.includes(itemId) ?? false;
    });

    const panelId = id ?? `panel-${itemId}`;

    // For selection-based Content (tabs): always render, use hidden attribute
    // For expand-based Content (accordion): conditional render
    if (!useHiddenAttribute && !isVisible) return null;

    const props: Record<string, unknown> = {
      id: panelId,
      "aria-labelledby": itemId,
      className,
      children,
    };

    if (contentRole) props.role = contentRole;
    if (useHiddenAttribute) props.hidden = !isVisible;
    // tabpanel needs tabindex=0 for Tab key navigation
    if (contentRole === "tabpanel") props.tabIndex = 0;

    return React.createElement("div", props);
  };
  ContentComponent.displayName = `${appId}.${zoneName}.Item.Content`;
  ItemComponent.Content = ContentComponent;

  // ── Field component ──
  const FieldComponent: React.FC<{
    name: string;
    value?: string;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
    mode?: import("@os-react/6-project/field/Field").FieldMode;
    fieldType?: import("@os-core/engine/registries/fieldRegistry").FieldType;
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
    Item: ItemComponent as BoundComponents<S>["Item"],
    Field: FieldComponent,
    When: WhenComponent,
  };
}
