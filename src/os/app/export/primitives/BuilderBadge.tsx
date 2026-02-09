/**
 * Builder.Badge — Semantic badge/tag primitive for CMS/Web Builder
 *
 * Renders a <span> badge with builder annotations.
 * Supports variant-based color presets.
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import type { BuilderLevel } from "./Builder";

export type BuilderBadgeVariant = "default" | "success" | "info" | "warning" | "accent";

export interface BuilderBadgeProps
    extends Omit<HTMLAttributes<HTMLSpanElement>, "id"> {
    /** Unique builder identifier */
    id: string;
    /** Badge visual variant */
    variant?: BuilderBadgeVariant;
    /** Badge contents */
    children: ReactNode;
}

export const BuilderBadge = forwardRef<HTMLSpanElement, BuilderBadgeProps>(
    function BuilderBadge(
        { id, variant = "default", children, className, ...rest },
        ref,
    ) {
        return (
            <span
                ref={ref}
                id={id}
                data-level={"item" satisfies BuilderLevel}
                data-builder-id={id}
                data-builder-type="badge"
                data-variant={variant}
                className={className}
                {...rest}
            >
                {children}
            </span>
        );
    },
);

BuilderBadge.displayName = "Builder.Badge";
