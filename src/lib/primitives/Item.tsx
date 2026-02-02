import { isValidElement, cloneElement } from "react";
import type { ReactNode, ReactElement } from "react";
// import { useCommandEngine } from "./CommandContext";
import { useFocusStore } from "../../stores/useFocusStore";

export interface ItemProps {
  id: string | number;
  active?: boolean;
  children: ReactNode;
  asChild?: boolean;
  // dispatch?: (cmd: any) => void; // Unused
  className?: string;
}

export const Item = ({
  id,
  active,
  children,
  asChild,
  className,
}: ItemProps) => {
  /* Refactor: Virtual Focus Logic - Logic-less Item */
  /* The Zone (parent) holds the physical focus (tabIndex=0). Item just renders style. */

  // OS-Level Focus Subscription
  const focusedItemId = useFocusStore((s) => s.focusedItemId);
  const setFocus = useFocusStore((s) => s.setFocus);

  // Derive "Virtual Active" state
  const isActuallyActive =
    active !== undefined ? active : String(focusedItemId) === String(id);

  const baseProps = {
    // ref: innerRef, // Virtual Focus doesn't need ref focus
    role: "option", // Semantic for activedescendant
    id: String(id), // ID for aria-activedescendant matching
    "aria-selected": isActuallyActive,
    "data-active": isActuallyActive ? "true" : undefined,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      setFocus(String(id));
      // Optional: Ensure parent Zone gets physical focus if not already?
      // With Zone's generic onFocus, clicking inside should bubble focus to Zone.
    },
  };

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<any>;
    return cloneElement(child, {
      ...baseProps,
      className:
        `outline-none ${child.props.className || ""} ${className || ""}`.trim(),
    });
  }
  return (
    <div {...baseProps} className={`outline-none ${className || ""}`.trim()}>
      {children}
    </div>
  );
};
