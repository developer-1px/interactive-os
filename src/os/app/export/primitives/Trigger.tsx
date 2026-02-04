import { cloneElement, isValidElement, useRef, useLayoutEffect, useContext } from "react";
import type {
  ReactNode,
  ReactElement,
  MouseEvent as ReactMouseEvent,
} from "react";
import { logger } from "@os/app/debug/logger.ts";
import { useCommandEngine } from "@os/features/command/ui/CommandContext.tsx";
import { FocusContext } from "@os/features/command/ui/CommandContext.tsx";
import type { BaseCommand } from "@os/entities/BaseCommand.ts";
import { DOMInterface } from "@os/features/focus/lib/DOMInterface.ts"; // [NEW] Registry
import { useFocusStore } from "@os/features/focus/model/focusStore.ts";

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
  const focusedItemId = useFocusStore((s) => s.focusedItemId);
  const isFocused = id ? focusedItemId === id : false;

  // --- Context Awareness (Zone Registration) ---
  const focusContext = useContext(FocusContext);
  const zoneId = focusContext?.zoneId || "unknown";
  const addItem = useFocusStore((s) => s.addItem);
  const removeItem = useFocusStore((s) => s.removeItem);

  // Zone Item Registration (like Item does)
  useLayoutEffect(() => {
    if (id && zoneId && zoneId !== "unknown") {
      addItem(zoneId, id);
      return () => removeItem(zoneId, id);
    }
  }, [id, zoneId, addItem, removeItem]);

  // [NEW] DOM Registry Registration
  useLayoutEffect(() => {
    if (id && triggerRef.current) {
      DOMInterface.registerItem(id, triggerRef.current);
    }
    return () => {
      if (id) DOMInterface.unregisterItem(id);
    };
  }, [id]);

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
