/**
 * Builder.Divider — Semantic divider/separator primitive for CMS/Web Builder
 *
 * Renders an <hr> or vertical divider with builder annotations.
 */

import { forwardRef, type HTMLAttributes } from "react";
import { useCursorMeta } from "../hooks/useCursorMeta";
import type { BuilderLevel } from "./Builder";

const CURSOR_META = { tag: "divider", color: "#64748b" } as const;

export type BuilderDividerOrientation = "horizontal" | "vertical";

export interface BuilderDividerProps
  extends Omit<HTMLAttributes<HTMLHRElement>, "id" | "children"> {
  /** Unique builder identifier */
  id: string;
  /** Divider orientation */
  orientation?: BuilderDividerOrientation;
}

export const BuilderDivider = forwardRef<HTMLHRElement, BuilderDividerProps>(
  function BuilderDivider(
    { id, orientation = "horizontal", className, style, ...rest },
    ref,
  ) {
    useCursorMeta(id, CURSOR_META);

    return (
      <hr
        ref={ref}
        id={id}
        aria-orientation={orientation}
        data-level={"item" satisfies BuilderLevel}
        data-builder-id={id}
        data-builder-type="divider"
        data-orientation={orientation}
        className={className}
        style={{
          border: "none",
          ...(orientation === "vertical"
            ? { width: "1px", alignSelf: "stretch" }
            : { height: "1px", width: "100%" }),
          ...style,
        }}
        {...rest}
      />
    );
  },
);

BuilderDivider.displayName = "Builder.Divider";
