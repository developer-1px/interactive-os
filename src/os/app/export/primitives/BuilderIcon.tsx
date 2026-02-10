/**
 * Builder.Icon — Semantic icon primitive for CMS/Web Builder
 *
 * Renders a Lucide icon (or any React component) with builder annotations.
 * Wraps the icon in a container div for focus ring visibility.
 */

import { type ComponentType, forwardRef, type HTMLAttributes } from "react";
import type { BuilderLevel } from "./Builder";

export interface BuilderIconProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Unique builder identifier */
  id: string;
  /** Lucide icon component or any SVG component */
  icon: ComponentType<{
    size?: number;
    className?: string;
    strokeWidth?: number;
  }>;
  /** Icon size in pixels */
  size?: number;
  /** Icon stroke width (for Lucide icons) */
  strokeWidth?: number;
  /** Additional icon className (applied to the SVG, not wrapper) */
  iconClassName?: string;
}

export const BuilderIcon = forwardRef<HTMLDivElement, BuilderIconProps>(
  function BuilderIcon(
    {
      id,
      icon: Icon,
      size = 24,
      strokeWidth,
      iconClassName,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        id={id}
        data-level={"item" satisfies BuilderLevel}
        data-builder-id={id}
        data-builder-type="icon"
        className={className}
        style={style}
        {...rest}
      >
        <Icon size={size} strokeWidth={strokeWidth} className={iconClassName} />
      </div>
    );
  },
);

BuilderIcon.displayName = "Builder.Icon";
