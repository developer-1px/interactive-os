/**
 * useQuery — React hook for kernel queries.
 *
 * Tests verify that useQuery integrates defineQuery with React's
 * rendering cycle via useSyncExternalStore, providing reactive
 * subscription to external data sources.
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createKernel } from "../../createKernel";

// ═══════════════════════════════════════════════════════════════════
// Test State
// ═══════════════════════════════════════════════════════════════════

interface TestState {
  focusedItemId: string | null;
  count: number;
}

const INITIAL: TestState = {
  focusedItemId: "item-1",
  count: 0,
};

function setup() {
  const kernel = createKernel<TestState>(INITIAL);
  const FOCUS = kernel.defineCommand("FOCUS", (ctx) => (itemId: string) => ({
    state: { ...ctx.state, focusedItemId: itemId },
  }));
  const INC = kernel.defineCommand("INC", (ctx) => () => ({
    state: { ...ctx.state, count: ctx.state.count + 1 },
  }));
  return { kernel, FOCUS, INC };
}

// ═══════════════════════════════════════════════════════════════════
// useQuery — Sync queries in React components
// ═══════════════════════════════════════════════════════════════════

describe("useQuery — React hook", () => {
  it("returns initial value from provider", () => {
    const { kernel } = setup();

    const FOCUSED_ID = kernel.defineQuery(
      "focused-id",
      (state: TestState) => state.focusedItemId,
    );

    const { result } = renderHook(() => kernel.useQuery(FOCUSED_ID));

    expect(result.current).toBe("item-1");
  });

  it("re-renders when state changes affect query result", () => {
    const { kernel, FOCUS } = setup();

    const FOCUSED_ID = kernel.defineQuery(
      "focused-id-2",
      (state: TestState) => state.focusedItemId,
    );

    const { result } = renderHook(() => kernel.useQuery(FOCUSED_ID));
    expect(result.current).toBe("item-1");

    act(() => {
      kernel.dispatch(FOCUS("item-2"));
    });

    expect(result.current).toBe("item-2");
  });

  it("does not re-render when unrelated state changes", () => {
    const { kernel, INC } = setup();

    const provider = vi.fn((state: TestState) => state.focusedItemId);

    const FOCUSED_ID = kernel.defineQuery("focused-id-3", provider);

    const renderCount = vi.fn();
    renderHook(() => {
      renderCount();
      return kernel.useQuery(FOCUSED_ID);
    });

    // Initial render
    expect(renderCount).toHaveBeenCalledTimes(1);

    act(() => {
      kernel.dispatch(INC()); // Changes count, not focusedItemId
    });

    // Should not re-render because focused-id result hasn't changed
    // (shallow equality check should prevent it)
    expect(renderCount).toHaveBeenCalledTimes(1);
  });

  it("respects invalidateOn — only re-queries on matching commands", () => {
    const { kernel, FOCUS, INC } = setup();

    const provider = vi.fn((state: TestState) => state.focusedItemId);

    const SELECTIVE = kernel.defineQuery("selective-2", provider, {
      invalidateOn: ["FOCUS"],
    });

    renderHook(() => kernel.useQuery(SELECTIVE));
    expect(provider).toHaveBeenCalledTimes(1);

    // INC should NOT trigger re-query
    act(() => {
      kernel.dispatch(INC());
    });

    // Provider should still be at 1 call (cached result, invalidateOn didn't match)
    expect(provider).toHaveBeenCalledTimes(1);

    // FOCUS SHOULD trigger re-query
    act(() => {
      kernel.dispatch(FOCUS("item-2"));
    });

    expect(provider).toHaveBeenCalledTimes(2);
  });
});
