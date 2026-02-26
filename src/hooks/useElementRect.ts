import { useCallback, useEffect, useState } from "react";

/**
 * Rect measured relative to a container, accounting for scroll.
 */
export interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * useElementRect — Track size & position of a DOM element.
 *
 * Pure React hook. No OS dependency.
 * Uses ResizeObserver + MutationObserver to stay in sync.
 *
 * @param element    The element to track (null = hidden)
 * @param container  Optional container for relative positioning (null = viewport)
 *
 * @example
 *   const rect = useElementRect(elRef.current, containerRef.current);
 *   // { top: 120, left: 30, width: 200, height: 48 }
 */
export function useElementRect(
  element: HTMLElement | null,
  container?: HTMLElement | null,
): ElementRect | null {
  const [rect, setRect] = useState<ElementRect | null>(null);

  const measure = useCallback(() => {
    if (!element) {
      setRect((prev) => (prev !== null ? null : prev));
      return;
    }

    const elRect = element.getBoundingClientRect();

    if (elRect.width === 0 && elRect.height === 0) {
      setRect((prev) => (prev !== null ? null : prev));
      return;
    }

    if (container) {
      const cRect = container.getBoundingClientRect();
      const next: ElementRect = {
        top: elRect.top - cRect.top + container.scrollTop,
        left: elRect.left - cRect.left + container.scrollLeft,
        width: elRect.width,
        height: elRect.height,
      };
      setRect((prev) =>
        prev &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.width === next.width &&
        prev.height === next.height
          ? prev
          : next,
      );
    } else {
      const next: ElementRect = {
        top: elRect.top,
        left: elRect.left,
        width: elRect.width,
        height: elRect.height,
      };
      setRect((prev) =>
        prev &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.width === next.width &&
        prev.height === next.height
          ? prev
          : next,
      );
    }
  }, [element, container]);

  useEffect(() => {
    if (!element) {
      setRect(null);
      return;
    }

    const ro = new ResizeObserver(measure);
    ro.observe(element);
    if (container) ro.observe(container);

    // MutationObserver for layout shifts (class/style changes on siblings)
    let mo: MutationObserver | null = null;
    const observeTarget = container ?? element.parentElement;
    if (observeTarget) {
      mo = new MutationObserver(measure);
      mo.observe(observeTarget, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }

    // Initial measure
    measure();

    return () => {
      ro.disconnect();
      mo?.disconnect();
    };
  }, [element, container, measure]);

  return rect;
}
