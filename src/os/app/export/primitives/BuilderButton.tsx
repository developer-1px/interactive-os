/**
 * Builder.Button — Semantic button primitive for CMS/Web Builder
 *
 * Renders a <button> with builder annotations and focus integration.
 * Supports variant-based styling presets.
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { BuilderLevel } from "./Builder";

export type BuilderButtonVariant = "primary" | "secondary" | "ghost" | "outline";

export interface BuilderButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "id"> {
    /** Unique builder identifier */
    id: string;
    /** Button visual variant */
    variant?: BuilderButtonVariant;
    /** Button contents */
    children: ReactNode;
}

export const BuilderButton = forwardRef<HTMLButtonElement, BuilderButtonProps>(
    function BuilderButton(
        { id, variant = "primary", children, className, type = "button", ...rest },
        ref,
    ) {
        return (
            <button
                ref={ref}
                id={id}
                type={type}
                data-level={"item" satisfies BuilderLevel}
                data-builder-id={id}
                data-builder-type="button"
                data-variant={variant}
                className={className}
                {...rest}
            >
                {children}
            </button>
        );
    },
);

BuilderButton.displayName = "Builder.Button";
