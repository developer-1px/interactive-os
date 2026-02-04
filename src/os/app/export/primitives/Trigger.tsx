import { cloneElement, isValidElement, useRef, useLayoutEffect } from "react";
import type {
  ReactNode,
  ReactElement,
  MouseEvent as ReactMouseEvent,
} from "react";
import { logger } from "@os/app/debug/logger.ts";
import { useCommandEngine } from "@os/features/command/ui/CommandContext.tsx";
import type { BaseCommand } from "@os/entities/BaseCommand.ts";
import { DOMInterface } from "@os/features/focus/lib/DOMInterface.ts"; // [NEW] Registry

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

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<any>;
    return cloneElement(child, {
      tabIndex: -1,
      className: `${child.props.className || ""} ${className || ""}`.trim(),
      onClick: (e: ReactMouseEvent) => {
        child.props.onClick?.(e);
        handleClick(e);
      },
      ...rest // Pass rest props to child? Maybe risky if clashes. Usually asChild means we only merge events/refs/class.
      // For now, let's keep it simple: className merging is critical.
    });
  }
  return <button ref={triggerRef} id={id} tabIndex={-1} onClick={handleClick} className={className} {...rest}>{children}</button>;
};
