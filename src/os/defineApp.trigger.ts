/**
 * defineApp — Trigger & Dialog component factories
 *
 * Pure functions that create bound trigger and dialog components.
 * Only dependency: appId (for displayName) and OS primitives.
 */

import type { BaseCommand, CommandFactory } from "@kernel/core/tokens";
import { Trigger } from "@os/6-components/primitives/Trigger";
import { Dialog } from "@os/6-components/radox/Dialog";
import React, { type ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════════
// Simple Trigger
// ═══════════════════════════════════════════════════════════════════

export function createSimpleTrigger(
  appId: string,
  command: BaseCommand,
): React.FC<{ children: ReactNode }> {
  const SimpleTrigger: React.FC<{ children: ReactNode }> = ({ children }) => {
    return React.createElement(Trigger, { onPress: command, children });
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
  }) => {
    const cmd = factory(payload as P);
    return React.createElement(Trigger, { onPress: cmd, children });
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
  role?: "dialog" | "alertdialog";
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
  Content: React.FC<{
    children: ReactNode;
    title?: string;
    className?: string;
    zoneClassName?: string;
  }>;
  Dismiss: React.FC<{ children: ReactNode; className?: string }>;
  Confirm: React.FC<{ children: ReactNode; className?: string }>;
}

export function createCompoundTrigger(
  appId: string,
  config: CompoundTriggerConfig,
): CompoundTriggerComponents {
  const dialogId = config.id ?? `${appId}-dialog-${Date.now()}`;

  const RootComponent: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(Dialog, { id: dialogId, ...(config.role !== undefined ? { role: config.role } : {}), children });
  RootComponent.displayName = `${appId}.Dialog`;

  const TriggerComponent: React.FC<{
    children: ReactNode;
    className?: string;
    asChild?: boolean;
  }> = ({ children, className, asChild }) =>
      React.createElement(Dialog.Trigger, {
        ...(className !== undefined ? { className } : {}),
        ...(asChild !== undefined ? { asChild } : {}),
        children,
      });
  TriggerComponent.displayName = `${appId}.Dialog.Trigger`;

  const ContentComponent: React.FC<{
    children: ReactNode;
    title?: string;
    className?: string;
    zoneClassName?: string;
  }> = (props) => React.createElement(Dialog.Content, props);
  ContentComponent.displayName = `${appId}.Dialog.Content`;

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
  }> = ({ children, className }) =>
      React.createElement(Dialog.Close, { className, children });
  DismissComponent.displayName = `${appId}.Dialog.Dismiss`;

  const ConfirmComponent: React.FC<{
    children: ReactNode;
    className?: string;
  }> = ({ children, className }) => {
    const confirmCmd = config.confirm;
    return React.createElement(Dialog.Close, {
      className,
      onPress: confirmCmd as any,
      children,
    });
  };
  ConfirmComponent.displayName = `${appId}.Dialog.Confirm`;

  return {
    Root: RootComponent,
    Trigger: TriggerComponent,
    Portal: PortalComponent,
    Content: ContentComponent,
    Dismiss: DismissComponent,
    Confirm: ConfirmComponent,
  };
}
