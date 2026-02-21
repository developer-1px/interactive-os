/**
 * defineQuery — Kernel Query Primitive Tests
 *
 * PRD-driven BDD scenarios for the fourth kernel primitive.
 * Tests cover: sync registration, sync subscription, async subscription,
 * selective invalidation, and cache stability.
 */

import { describe, expect, it, vi } from "vitest";
import { createKernel } from "../../createKernel";

// ═══════════════════════════════════════════════════════════════════
// Test State
// ═══════════════════════════════════════════════════════════════════

interface TestState {
  focusedItemId: string | null;
  userId: string;
  count: number;
}

const INITIAL: TestState = {
  focusedItemId: "item-1",
  userId: "user-1",
  count: 0,
};

function setup(initialState: TestState = INITIAL) {
  const kernel = createKernel<TestState>(initialState);
  const INC = kernel.defineCommand("INC", (ctx) => () => ({
    state: { ...ctx.state, count: ctx.state.count + 1 },
  }));
  const FOCUS = kernel.defineCommand("FOCUS", (ctx) => (itemId: string) => ({
    state: { ...ctx.state, focusedItemId: itemId },
  }));
  return { kernel, INC, FOCUS };
}

// ═══════════════════════════════════════════════════════════════════
// 1.1 defineQuery — Sync Query Registration
// ═══════════════════════════════════════════════════════════════════

describe("defineQuery — sync registration", () => {
  it("returns a QueryToken when registered", () => {
    const { kernel } = setup();

    const FOCUSED_RECT = kernel.defineQuery(
      "focused-rect",
      (state) => state.focusedItemId,
    );

    // QueryToken should be an object with __id
    expect(FOCUSED_RECT).toBeDefined();
    expect(FOCUSED_RECT.__id).toBe("focused-rect");
  });

  it("re-registers same ID (HMR safe)", () => {
    const { kernel } = setup();

    const provider1 = vi.fn((state: TestState) => state.focusedItemId);
    const provider2 = vi.fn((state: TestState) => state.userId);

    kernel.defineQuery("test-query", provider1);
    kernel.defineQuery("test-query", provider2);

    // Should use the latest provider
    const result = kernel.resolveQuery("test-query");
    expect(provider2).toHaveBeenCalled();
    expect(result).toBe("user-1");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 1.2 useQuery — Sync Query Subscription (non-React tests)
// ═══════════════════════════════════════════════════════════════════

describe("resolveQuery — sync query resolution", () => {
  it("resolves provider with current state", () => {
    const { kernel } = setup();

    kernel.defineQuery("focused-id", (state: TestState) => state.focusedItemId);

    const result = kernel.resolveQuery("focused-id");
    expect(result).toBe("item-1");
  });

  it("returns fresh value after state change", () => {
    const { kernel, FOCUS } = setup();

    kernel.defineQuery("focused-id", (state: TestState) => state.focusedItemId);

    expect(kernel.resolveQuery("focused-id")).toBe("item-1");

    kernel.dispatch(FOCUS("item-2"));

    expect(kernel.resolveQuery("focused-id")).toBe("item-2");
  });

  it("provider receives full kernel state", () => {
    const { kernel } = setup();

    const provider = vi.fn((state: TestState) => ({
      focused: state.focusedItemId,
      user: state.userId,
    }));

    kernel.defineQuery("combined", provider);
    kernel.resolveQuery("combined");

    expect(provider).toHaveBeenCalledWith(
      expect.objectContaining({
        focusedItemId: "item-1",
        userId: "user-1",
        count: 0,
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// 1.4 invalidateOn — Selective Invalidation
// ═══════════════════════════════════════════════════════════════════

describe("invalidateOn — selective invalidation", () => {
  it("only invalidates on specified command types", () => {
    const { kernel, INC, FOCUS } = setup();

    const provider = vi.fn((state: TestState) => state.focusedItemId);

    kernel.defineQuery("selective", provider, {
      invalidateOn: ["FOCUS"],
    });

    // Initial resolve
    kernel.resolveQuery("selective");
    expect(provider).toHaveBeenCalledTimes(1);

    // INC should NOT invalidate
    kernel.dispatch(INC());
    const stale = kernel.resolveQuery("selective");
    // Provider should still only have been called once (cached)
    expect(provider).toHaveBeenCalledTimes(1);
    expect(stale).toBe("item-1");

    // FOCUS should invalidate
    kernel.dispatch(FOCUS("item-2"));
    const fresh = kernel.resolveQuery("selective");
    expect(provider).toHaveBeenCalledTimes(2);
    expect(fresh).toBe("item-2");
  });

  it("invalidateOn not specified → reacts to all state changes", () => {
    const { kernel, INC } = setup();

    const provider = vi.fn((state: TestState) => state.count);

    kernel.defineQuery("all-reactive", provider);

    kernel.resolveQuery("all-reactive");
    expect(provider).toHaveBeenCalledTimes(1);

    kernel.dispatch(INC());
    kernel.resolveQuery("all-reactive");
    // Should re-execute after any state change
    expect(provider).toHaveBeenCalledTimes(2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 1.3 Async Query
// ═══════════════════════════════════════════════════════════════════

describe("defineQuery — async provider", () => {
  it("resolves async provider returning QueryResult shape", async () => {
    const { kernel } = setup();

    kernel.defineQuery("user-profile", async (state: TestState) => ({
      name: "Alice",
      id: state.userId,
    }));

    // resolveQuery for async should return a promise or QueryResult
    const result = kernel.resolveQuery("user-profile");
    // Async provider returns a Promise
    expect(result).toBeInstanceOf(Promise);

    const resolved = await result;
    expect(resolved).toEqual({ name: "Alice", id: "user-1" });
  });
});

// ═══════════════════════════════════════════════════════════════════
// Cache Stability
// ═══════════════════════════════════════════════════════════════════

describe("query cache stability", () => {
  it("does not re-run provider when state hasn't changed", () => {
    const { kernel } = setup();

    const provider = vi.fn((state: TestState) => state.focusedItemId);

    kernel.defineQuery("cached", provider);

    // Call twice without state change
    kernel.resolveQuery("cached");
    kernel.resolveQuery("cached");

    // Provider should only be called once (cached)
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("re-runs provider when state changes between resolves", () => {
    const { kernel, INC } = setup();

    const provider = vi.fn((state: TestState) => state.count);

    kernel.defineQuery("count-query", provider);

    kernel.resolveQuery("count-query");
    expect(provider).toHaveBeenCalledTimes(1);

    kernel.dispatch(INC());
    kernel.resolveQuery("count-query");
    expect(provider).toHaveBeenCalledTimes(2);
  });
});
