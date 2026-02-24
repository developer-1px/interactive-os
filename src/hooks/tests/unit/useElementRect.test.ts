import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useElementRect } from "@/hooks/useElementRect";

// ── Mock ResizeObserver & MutationObserver ──

let roCallback: ResizeObserverCallback;
let moCallback: MutationCallback;

class MockResizeObserver {
  constructor(cb: ResizeObserverCallback) {
    roCallback = cb;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

class MockMutationObserver {
  constructor(cb: MutationCallback) {
    moCallback = cb;
  }
  observe = vi.fn();
  disconnect = vi.fn();
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  vi.stubGlobal("MutationObserver", MockMutationObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
});

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

describe("useElementRect", () => {
  it("returns null when element is null", () => {
    const { result } = renderHook(() => useElementRect(null));
    expect(result.current).toBeNull();
  });

  it("returns rect for a visible element (viewport-relative)", () => {
    const el = mockElement(makeDOMRect(100, 50, 200, 40));
    const { result } = renderHook(() => useElementRect(el));
    expect(result.current).toEqual({
      top: 100,
      left: 50,
      width: 200,
      height: 40,
    });
  });

  it("returns null for zero-size element", () => {
    const el = mockElement(makeDOMRect(100, 50, 0, 0));
    const { result } = renderHook(() => useElementRect(el));
    expect(result.current).toBeNull();
  });

  it("calculates container-relative position", () => {
    const el = mockElement(makeDOMRect(150, 80, 200, 40));
    const container = {
      getBoundingClientRect: () => makeDOMRect(50, 30, 600, 400),
      scrollTop: 0,
      scrollLeft: 0,
      parentElement: null,
    } as unknown as HTMLElement;

    const { result } = renderHook(() => useElementRect(el, container));
    expect(result.current).toEqual({
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

    const { result } = renderHook(() => useElementRect(el, container));
    expect(result.current).toEqual({
      top: 300, // 150 - 50 + 200
      left: 60, // 80 - 30 + 10
      width: 200,
      height: 40,
    });
  });

  it("returns null → rect on element change", () => {
    const { result, rerender } = renderHook(({ el }) => useElementRect(el), {
      initialProps: { el: null as HTMLElement | null },
    });
    expect(result.current).toBeNull();

    const el = mockElement(makeDOMRect(10, 20, 100, 50));
    rerender({ el });
    expect(result.current).toEqual({
      top: 10,
      left: 20,
      width: 100,
      height: 50,
    });
  });

  it("stabilizes output when rect is unchanged", () => {
    const el = mockElement(makeDOMRect(10, 20, 100, 50));
    const { result, rerender } = renderHook(() => useElementRect(el));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first); // reference equality
  });
});
