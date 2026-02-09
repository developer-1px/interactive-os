/**
 * Builder.Image — Semantic image primitive for CMS/Web Builder
 *
 * Wraps <img> with Builder.Item focus integration.
 * Supports src swap via onChangeSrc callback.
 */

import { forwardRef, type HTMLAttributes } from "react";
import { type BuilderLevel } from "./Builder";

// Re-use the same createBuilderComponent pattern internally
// but here we render a concrete <img> element instead of Slot

export interface BuilderImageProps
    extends Omit<HTMLAttributes<HTMLImageElement>, "children"> {
    /** Unique builder identifier */
    id: string;
    /** Image source URL */
    src: string;
    /** Alt text for accessibility */
    alt: string;
    /** Object-fit behavior */
    objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
    /** Callback to change the image source (for builder editing) */
    onChangeSrc?: (newSrc: string) => void;
}

export const BuilderImage = forwardRef<HTMLImageElement, BuilderImageProps>(
    function BuilderImage(
        { id, src, alt, objectFit = "cover", onChangeSrc, className, style, ...rest },
        ref,
    ) {
        return (
            <img
                ref={ref}
                id={id}
                src={src}
                alt={alt}
                data-level={"item" satisfies BuilderLevel}
                data-builder-id={id}
                data-builder-type="image"
                className={className}
                style={{ objectFit, ...style }}
                draggable={false}
                {...rest}
            />
        );
    },
);

BuilderImage.displayName = "Builder.Image";
