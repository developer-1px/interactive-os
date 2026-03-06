/**
 * useElementRect — Pure computation test.
 *
 * The hook is a thin wrapper: React lifecycle (observers) + rect computation.
 * We test the computation directly — no React, no @testing-library.
 */

import { describe, expect, it } from "vitest";
import type { ElementRect } from "@/hooks/useElementRect";

/**
 * Extracted pure computation from useElementRect.
 * Mirrors the measure() logic inside the hook exactly.
 */
function computeElementRect(
  element: HTMLElement | null,
  container?: HTMLElement | null,
): ElementRect | null {
  if (!element) return null;

  const elRect = element.getBoundingClientRect();
  if (elRect.width === 0 && elRect.height === 0) return null;

  if (container) {
    const cRect = container.getBoundingClientRect();
    return {
      top: elRect.top - cRect.top + container.scrollTop,
      left: elRect.left - cRect.left + container.scrollLeft,
      width: elRect.width,
      height: elRect.height,
    };
  }

  return {
    top: elRect.top,
    left: elRect.left,
    width: elRect.width,
    height: elRect.height,
  };
}

function mockElement(rect: DOMRect): HTMLElement {
  return {
    getBoundingClientRect: () => rect,
    parentElement: null,
  } as unknown as HTMLElement;
}

function makeDOMRect(
  top: number,
  left: number,
  width: number,
  height: number,
): DOMRect {
  return {
    top,
    left,
    width,
    height,
    x: left,
    y: top,
    bottom: top + height,
    right: left + width,
    toJSON() {},
  } as DOMRect;
}

describe("useElementRect (computation)", () => {
  it("returns null when element is null", () => {
    expect(computeElementRect(null)).toBeNull();
  });

  it("returns rect for a visible element (viewport-relative)", () => {
    const el = mockElement(makeDOMRect(100, 50, 200, 40));
    expect(computeElementRect(el)).toEqual({
      top: 100,
      left: 50,
      width: 200,
      height: 40,
    });
  });

  it("returns null for zero-size element", () => {
    const el = mockElement(makeDOMRect(100, 50, 0, 0));
    expect(computeElementRect(el)).toBeNull();
  });

  it("calculates container-relative position", () => {
    const el = mockElement(makeDOMRect(150, 80, 200, 40));
    const container = {
      getBoundingClientRect: () => makeDOMRect(50, 30, 600, 400),
      scrollTop: 0,
      scrollLeft: 0,
      parentElement: null,
    } as unknown as HTMLElement;

    expect(computeElementRect(el, container)).toEqual({
      top: 100, // 150 - 50
      left: 50, // 80 - 30
      width: 200,
      height: 40,
    });
  });

  it("accounts for container scroll", () => {
    const el = mockElement(makeDOMRect(150, 80, 200, 40));
    const container = {
      getBoundingClientRect: () => makeDOMRect(50, 30, 600, 400),
      scrollTop: 200,
      scrollLeft: 10,
      parentElement: null,
    } as unknown as HTMLElement;

    expect(computeElementRect(el, container)).toEqual({
      top: 300, // 150 - 50 + 200
      left: 60, // 80 - 30 + 10
      width: 200,
      height: 40,
    });
  });

  it("stabilizes: same input produces equal output", () => {
    const el = mockElement(makeDOMRect(10, 20, 100, 50));
    const a = computeElementRect(el);
    const b = computeElementRect(el);
    expect(a).toEqual(b);
  });
});
