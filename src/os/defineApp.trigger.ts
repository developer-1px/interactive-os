/**
 * defineApp — Trigger & Dialog component factories
 *
 * Pure functions that create bound trigger and dialog components.
 * Only dependency: appId (for displayName) and OS namespace (for primitives).
 */

import type { CommandFactory } from "@kernel/core/tokens";
import { OS } from "@os/AntigravityOS";
import React, { type ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════════
// Simple Trigger
// ═══════════════════════════════════════════════════════════════════

export function createSimpleTrigger(
  appId: string,
  command: CommandFactory<string, any>,
): React.FC<{ payload?: any; children: ReactNode }> {
  const SimpleTrigger: React.FC<{ payload?: any; children: ReactNode }> = ({
    payload,
    children,
  }) => {
    return React.createElement(
      OS.Trigger as any,
      { onPress: command(payload ?? {}) },
      children,
    );
  };
  SimpleTrigger.displayName = `${appId}.Trigger`;
  return SimpleTrigger;
}

// ═══════════════════════════════════════════════════════════════════
// Compound Trigger (Dialog pattern)
// ═══════════════════════════════════════════════════════════════════

export interface CompoundTriggerConfig {
  id?: string;
  confirm?: CommandFactory<string, any>;
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
    React.createElement(OS.Dialog as any, { id: dialogId }, children);
  RootComponent.displayName = `${appId}.Dialog`;

  const TriggerComponent: React.FC<{
    children: ReactNode;
    className?: string;
    asChild?: boolean;
  }> = ({ children, className, asChild }) =>
    React.createElement(
      (OS.Dialog as any).Trigger,
      { className, asChild },
      children,
    );
  TriggerComponent.displayName = `${appId}.Dialog.Trigger`;

  const ContentComponent: React.FC<{
    children: ReactNode;
    title?: string;
    className?: string;
    zoneClassName?: string;
  }> = (props) => React.createElement((OS.Dialog as any).Content, props as any);
  ContentComponent.displayName = `${appId}.Dialog.Content`;

  const PortalComponent: React.FC<{
    children: ReactNode;
    title?: string;
    description?: string;
    className?: string;
    contentClassName?: string;
  }> = (props) => React.createElement((OS.Trigger as any).Portal, props as any);
  PortalComponent.displayName = `${appId}.Dialog.Portal`;

  const DismissComponent: React.FC<{
    children: ReactNode;
    className?: string;
  }> = ({ children, className }) =>
    React.createElement((OS.Dialog as any).Close, { className }, children);
  DismissComponent.displayName = `${appId}.Dialog.Dismiss`;

  const ConfirmComponent: React.FC<{
    children: ReactNode;
    className?: string;
  }> = ({ children, className }) => {
    const confirmCmd = config.confirm ? config.confirm({} as any) : undefined;
    return React.createElement(
      (OS.Dialog as any).Close,
      { className, onPress: confirmCmd },
      children,
    );
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
