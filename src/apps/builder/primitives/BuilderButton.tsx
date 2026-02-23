/**
 * Builder.Button — Semantic button primitive for CMS/Web Builder
 *
 * Renders a <button> with builder annotations and focus integration.
 * Supports variant-based styling presets.
 */

import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";
import { useCursorMeta } from "../hooks/useCursorMeta";
import type { BuilderLevel } from "./Builder";

const CURSOR_META = { tag: "button", color: "#3b82f6" } as const;

export type BuilderButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline";

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
    useCursorMeta(id, CURSOR_META);

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
