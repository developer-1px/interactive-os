import { cloneElement, isValidElement, useRef, useLayoutEffect } from "react";
import type {
  ReactNode,
  ReactElement,
  MouseEvent as ReactMouseEvent,
} from "react";
import { logger } from "@os/app/debug/logger.ts";
import { useCommandEngine } from "@os/features/command/ui/CommandContext.tsx";

import type { BaseCommand } from "@os/entities/BaseCommand.ts";
// [NEW] Local Store & Global Registry
import { useFocusGroupStore, useFocusGroupContext } from "@os/features/focus/primitives/FocusGroup";
import { DOMRegistry } from "@os/features/focus/registry/DOMRegistry.ts";

export interface TriggerProps<T extends BaseCommand> extends React.HTMLAttributes<HTMLButtonElement> {
  id?: string;
  command: T;
  children: ReactNode;
  asChild?: boolean;
  dispatch?: (cmd: T) => void;
  allowPropagation?: boolean;
}

export const Trigger = <T extends BaseCommand>({
  id,
  command,
  children,
  asChild,
  dispatch: customDispatch,
  allowPropagation = false,
  className,
  ...rest
}: TriggerProps<T>) => {
  const { dispatch: contextDispatch } = useCommandEngine();
  const dispatch = customDispatch || contextDispatch;
  const triggerRef = useRef<HTMLButtonElement>(null);

  // --- Focus State Tracking ---
  const store = useFocusGroupStore();
  const focusedItemId = store((s) => s.focusedItemId);
  const isFocused = id ? focusedItemId === id : false;

  // --- Context Awareness (Zone Registration) ---
  const focusContext = useFocusGroupContext();
  const zoneId = focusContext?.zoneId || "unknown";
  const addItem = store((s) => s.addItem);
  const removeItem = store((s) => s.removeItem);

  // Zone Item Registration (like Item does)
  useLayoutEffect(() => {
    if (id && addItem && zoneId && zoneId !== "unknown") {
      addItem(id);
      return () => { if (removeItem) removeItem(id); }
    }
  }, [id, zoneId, addItem, removeItem]);

  // [NEW] DOM Registry Registration
  useLayoutEffect(() => {
    if (id && triggerRef.current) {
      DOMRegistry.registerItem(id, zoneId, triggerRef.current);
    }
    return () => {
      if (id) DOMRegistry.unregisterItem(id);
    };
  }, [id, zoneId]);

  const handleClick = (e: ReactMouseEvent) => {
    if (!allowPropagation) {
      e.stopPropagation();
    }
    logger.debug("PRIMITIVE", `Trigger Clicked: [${command.type}]`);
    dispatch(command);
  };

  // Base props for focus state
  const baseProps = {
    ref: triggerRef,
    id,
    "data-item-id": id, // Essential for FocusBridge to detect native focus
    tabIndex: 0, // Always tabbable for browser Tab navigation (tab="flow")
    onClick: handleClick,
    className,
    "data-focused": isFocused ? "true" : undefined,
    "data-trigger-id": id,
    ...rest
  };

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<any>;
    return cloneElement(child, {
      ...baseProps,
      className: `${child.props.className || ""} ${className || ""}`.trim(),
      onClick: (e: ReactMouseEvent) => {
        child.props.onClick?.(e);
        handleClick(e);
      },
    });
  }
  return <button {...baseProps}>{children}</button>;
};
