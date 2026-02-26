import type React from "react";
import type { ReactElement } from "react";
import { cloneElement, forwardRef, isValidElement } from "react";

export interface LabelProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The ID/Name of the Field to focus when this Label is clicked.
   * If omitted, will auto-focus the first Field inside the Label.
   */
  for?: string;

  /**
   * If true, Label will merge its props onto its immediate child.
   */
  asChild?: boolean;
}

/**
 * Label - Field's Companion
 *
 * Extends the hit area for a Field. When clicked, focuses the associated Field.
 * This is the ZIFT equivalent of HTML's <label for="...">, but works with
 * contentEditable Fields and integrates with the Focus Pipeline.
 *
 * Label is NOT a core ZIFT primitive (Zone, Item, Field, Trigger).
 * It's a companion helper that exists solely to enhance Field's usability.
 *
 * Focus styling: Use CSS :has() to react to inner Field's data-focused state.
 * Example: className="has-[[data-focused=true]]:ring-2 ..."
 *
 * @example
 * <Label className="p-4 border rounded-lg has-[[data-focused=true]]:ring-2">
 *   <SearchIcon />
 *   <Field name="searchInput" placeholder="Search..." />
 * </Label>
 */
export const Label = forwardRef<HTMLDivElement, LabelProps>(
  ({ for: targetId, asChild = false, children, className, ...props }, ref) => {
    const baseProps = {
      "data-label": "",
      "data-for": targetId,
      className,
      ...props,
    };

    if (asChild && isValidElement(children)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cloneElement
      const child = children as ReactElement<any>;
      return cloneElement(child, {
        ...baseProps,
        ref,
        className: `${child.props.className || ""} ${className || ""}`.trim(),
      });
    }

    return (
      <div ref={ref} {...baseProps}>
        {children}
      </div>
    );
  },
);

Label.displayName = "Label";
