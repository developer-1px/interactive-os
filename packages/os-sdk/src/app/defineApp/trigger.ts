/**
 * defineApp — Trigger & Dialog component factories
 *
 * Pure functions that create bound trigger and dialog components.
 * Only dependency: appId (for displayName) and OS primitives.
 */

import type { BaseCommand, CommandFactory } from "@kernel/core/tokens";
import { TriggerOverlayRegistry } from "@os-core/engine/registries/triggerRegistry";
import { Trigger } from "@os-react/6-project/Trigger";
import { Dialog } from "@os-react/6-project/widgets/radix/Dialog";
import React, { type ReactNode, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
// Simple Trigger
// ═══════════════════════════════════════════════════════════════════

export function createSimpleTrigger(
  appId: string,
  command: BaseCommand,
): React.FC<{ children: ReactNode }> {
  const SimpleTrigger: React.FC<{ children: ReactNode }> = ({
    children,
    ...rest
  }) => {
    return React.createElement(Trigger, {
      onActivate: command,
      children,
      ...rest,
    });
  };
  SimpleTrigger.displayName = `${appId}.Trigger`;
  return SimpleTrigger;
}

// ═══════════════════════════════════════════════════════════════════
// Dynamic Trigger (CommandFactory bound at render time)
// ═══════════════════════════════════════════════════════════════════

/** Props for dynamic trigger — payload required when P is not void */
type DynamicTriggerProps<P> = P extends void
  ? { children: ReactNode; payload?: never }
  : { children: ReactNode; payload: P };

export function createDynamicTrigger<P>(
  appId: string,
  factory: CommandFactory<string, P>,
): React.FC<DynamicTriggerProps<P>> {
  const DynamicTrigger: React.FC<DynamicTriggerProps<P>> = ({
    children,
    payload,
    ...rest
  }) => {
    const cmd = factory(payload as P);
    return React.createElement(Trigger, { onActivate: cmd, children, ...rest });
  };
  DynamicTrigger.displayName = `${appId}.DynamicTrigger`;
  return DynamicTrigger;
}

// ═══════════════════════════════════════════════════════════════════
// Compound Trigger (Dialog pattern)
// ═══════════════════════════════════════════════════════════════════

export interface CompoundTriggerConfig {
  id?: string;
  confirm?: BaseCommand;
  role?: "dialog" | "alertdialog" | "menu" | "popover" | "tooltip" | "listbox";
}

export interface CompoundTriggerComponents {
  Root: React.FC<{ children: ReactNode }>;
  Trigger: React.FC<{
    children: ReactNode;
    className?: string;
    asChild?: boolean;
  }>;
  Portal: React.FC<{
    children: ReactNode;
    title?: string;
    description?: string;
    className?: string;
    contentClassName?: string;
  }>;
  /** Popover — non-modal overlay (menus, dropdowns). Present when role is menu/listbox/popover. */
  Popover: React.FC<{
    children: ReactNode;
    className?: string;
    "aria-label"?: string;
    "aria-labelledby"?: string;
  }>;
  Content: React.FC<{
    children: ReactNode;
    title?: string;
    className?: string;
    zoneClassName?: string;
  }>;
  Dismiss: React.FC<{
    children: ReactNode;
    className?: string;
    onActivate?: BaseCommand;
  }>;
  Confirm: React.FC<{ children: ReactNode; className?: string }>;
}

export function createCompoundTrigger(
  appId: string,
  config: CompoundTriggerConfig,
): CompoundTriggerComponents {
  const overlayId = config.id ?? `${appId}-dialog-${Date.now()}`;
  const role = config.role ?? "dialog";

  // Route: menu/listbox/popover → Popover pattern, dialog/alertdialog → Dialog pattern
  const isPopoverRole =
    role === "menu" || role === "listbox" || role === "popover";

  const RootComponent: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Register trigger→overlay relationship for headless ARIA
    useEffect(() => {
      TriggerOverlayRegistry.set(overlayId, overlayId, role);
      return () => TriggerOverlayRegistry.clear(overlayId);
    }, []);

    if (isPopoverRole) {
      // Popover pattern: no Dialog shell needed
      return React.createElement(React.Fragment, null, children);
    }

    // Dialog pattern: Dialog shell
    return React.createElement(Dialog, {
      id: overlayId,
      role: role as "dialog" | "alertdialog",
      children,
    });
  };
  RootComponent.displayName = `${appId}.${isPopoverRole ? "Menu" : "Dialog"}`;

  const TriggerComponent: React.FC<{
    children: ReactNode;
    className?: string;
    asChild?: boolean;
  }> = ({ children, className, asChild }) => {
    if (isPopoverRole) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ZIFT overlay role union mismatch
      return React.createElement(Trigger, {
        id: `${overlayId}-trigger`,
        role: role as any,
        overlayId,
        children,
        ...(className !== undefined ? { className } : {}),
      });
    }
    return React.createElement(Dialog.Trigger, {
      ...(className !== undefined ? { className } : {}),
      ...(asChild !== undefined ? { asChild } : {}),
      children,
    });
  };
  TriggerComponent.displayName = `${appId}.${isPopoverRole ? "Menu" : "Dialog"}.Trigger`;

  // PopoverComponent: non-modal overlay for menus/listboxes
  const PopoverComponent: React.FC<{
    children: ReactNode;
    className?: string;
    "aria-label"?: string;
    "aria-labelledby"?: string;
  }> = (props) =>
    React.createElement(Trigger.Popover, {
      ...props,
      _overlayId: overlayId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ZIFT overlay type union
      _overlayType: role as any,
    });
  PopoverComponent.displayName = `${appId}.Menu.Popover`;

  // Dialog.Content must be used directly — DialogRoot identifies children by
  // reference identity (child.type === DialogContent). Wrapping in a new
  // component breaks this check, preventing the portal from rendering.
  const ContentComponent = Dialog.Content;

  const PortalComponent: React.FC<{
    children: ReactNode;
    title?: string;
    description?: string;
    className?: string;
    contentClassName?: string;
  }> = (props) => React.createElement(Trigger.Portal, props);
  PortalComponent.displayName = `${appId}.Dialog.Portal`;

  const DismissComponent: React.FC<{
    children: ReactNode;
    className?: string;
    onActivate?: BaseCommand;
  }> = ({ children, className, onActivate }) => {
    const props: import("./6-project/radix/Dialog").DialogCloseProps = {
      children,
      ...(className !== undefined ? { className } : {}),
      ...(onActivate !== undefined ? { onActivate } : {}),
    };
    return React.createElement(Dialog.Close, props);
  };
  DismissComponent.displayName = `${appId}.Dialog.Dismiss`;

  const ConfirmComponent: React.FC<{
    children: ReactNode;
    className?: string;
  }> = ({ children, className }) => {
    const confirmCmd = config.confirm;
    const props: import("./6-project/radix/Dialog").DialogCloseProps = {
      children,
      ...(className !== undefined ? { className } : {}),
      ...(confirmCmd !== undefined ? { onActivate: confirmCmd } : {}),
      id: `${overlayId}-confirm`,
    };
    return React.createElement(Dialog.Close, props);
  };
  ConfirmComponent.displayName = `${appId}.Dialog.Confirm`;

  return {
    Root: RootComponent,
    Trigger: TriggerComponent,
    Portal: PortalComponent,
    Popover: PopoverComponent,
    Content: ContentComponent,
    Dismiss: DismissComponent,
    Confirm: ConfirmComponent,
  };
}
