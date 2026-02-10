/**
 * Builder.Link — Semantic link primitive for CMS/Web Builder
 *
 * Renders an <a> tag with builder annotations and focus integration.
 */

import { type AnchorHTMLAttributes, forwardRef, type ReactNode } from "react";
import type { BuilderLevel } from "./Builder";

export interface BuilderLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "id"> {
  /** Unique builder identifier */
  id: string;
  /** Link contents */
  children: ReactNode;
}

export const BuilderLink = forwardRef<HTMLAnchorElement, BuilderLinkProps>(
  function BuilderLink({ id, children, className, href = "#", ...rest }, ref) {
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
