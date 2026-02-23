/**
 * Builder.Link — Semantic link primitive for CMS/Web Builder
 *
 * Renders an <a> tag with builder annotations and focus integration.
 */

import { type AnchorHTMLAttributes, forwardRef, type ReactNode } from "react";
import { useCursorMeta } from "../hooks/useCursorMeta";
import type { BuilderLevel } from "./Builder";

const CURSOR_META = { tag: "link", color: "#6366f1" } as const;

export interface BuilderLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "id"> {
  /** Unique builder identifier */
  id: string;
  /** Link contents */
  children: ReactNode;
}

export const BuilderLink = forwardRef<HTMLAnchorElement, BuilderLinkProps>(
  function BuilderLink({ id, children, className, href = "#", ...rest }, ref) {
    useCursorMeta(id, CURSOR_META);

    return (
      <a
        ref={ref}
        id={id}
        href={href}
        data-level={"item" satisfies BuilderLevel}
        data-builder-id={id}
        data-builder-type="link"
        className={className}
        {...rest}
      >
        {children}
      </a>
    );
  },
);

BuilderLink.displayName = "Builder.Link";
