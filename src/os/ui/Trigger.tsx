import { cloneElement, isValidElement } from "react";
import type {
  ReactNode,
  ReactElement,
  MouseEvent as ReactMouseEvent,
} from "react";
import { logger } from "@os/debug/logger";
import { useCommandEngine } from "@os/core/command/CommandContext";
import type { BaseCommand } from "@os/ui/types";

export interface TriggerProps<T extends BaseCommand> extends React.HTMLAttributes<HTMLButtonElement> {
  command: T;
  children: ReactNode;
  asChild?: boolean;
  dispatch?: (cmd: T) => void;
  allowPropagation?: boolean;
}

export const Trigger = <T extends BaseCommand>({
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
  return <button tabIndex={-1} onClick={handleClick} className={className} {...rest}>{children}</button>;
};
