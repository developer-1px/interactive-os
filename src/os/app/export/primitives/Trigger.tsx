import type { BaseCommand } from "@/os-new/schema/command/BaseCommand";
import { useCommandEngine } from "@os/features/command/ui/CommandContext.tsx";
import { FocusItem } from "@/os-new/primitives/FocusItem";
import type {
  ReactElement,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import { cloneElement, forwardRef, isValidElement } from "react";

export interface TriggerProps<T extends BaseCommand>
  extends React.HTMLAttributes<HTMLButtonElement> {
  id?: string;
  onPress: T;
  children: ReactNode;
  asChild?: boolean;
  dispatch?: (cmd: T) => void;
  allowPropagation?: boolean;
}

export const Trigger = forwardRef<HTMLButtonElement, TriggerProps<BaseCommand>>(
  (
    {
      id,
      onPress,
      children,
      asChild,
      dispatch: customDispatch,
      allowPropagation = false,
      className,
      onClick,
      ...rest
    },
    ref,
  ) => {
    const { dispatch: contextDispatch } = useCommandEngine();
    const dispatch = customDispatch || contextDispatch;

    const handleClick = (e: ReactMouseEvent) => {
      if (!allowPropagation) {
        e.stopPropagation();
      }
      dispatch(onPress);
      onClick?.(e as any);
    };

    const baseProps = {
      onClick: handleClick,
      className,
      "data-trigger-id": id,
      ...rest,
    };

    // Logic: Trigger *is* a FocusItem if an ID is provided.
    // If no ID, it's just a dumb trigger?
    // Existing Trigger code did registration if ID was present.

    if (id) {
      return (
        <FocusItem
          id={id}
          asChild={true} // Triggers almost always wrap a button/element
          ref={ref}
          {...baseProps}
        >
          {asChild && isValidElement(children) ? (
            children
          ) : (
            <button type="button">{children}</button>
          )}
        </FocusItem>
      );
    }

    // Fallback for non-spec triggers (should happen less often in FocusGroup model)
    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<any>;
      return cloneElement(child, {
        ...baseProps,
        ref,
        className: `${child.props.className || ""} ${className || ""}`.trim(),
        onClick: (e: ReactMouseEvent) => {
          child.props.onClick?.(e);
          handleClick(e);
        },
      });
    }

    return (
      <button type="button" ref={ref} {...baseProps}>
        {children}
      </button>
    );
  },
);

Trigger.displayName = "Trigger";
