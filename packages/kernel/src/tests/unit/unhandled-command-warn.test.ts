/**
 * T1: Kernel warns on unhandled commands
 *
 * When a command is dispatched but no handler is found in the entire
 * scope chain, the kernel should log a warning — just like it already
 * does for unknown effects.
 *
 * The kernel uses a module-level logger that delegates to console.warn.
 * We spy on console.warn to verify.
 */

import { createKernel, defineScope } from "@kernel";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("T1: Kernel warns on unhandled command", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("#1 dispatching a command with no handler logs a warning", () => {
    const kernel = createKernel({});

    kernel.dispatch({ type: "NONEXISTENT_COMMAND" });

    expect(warnSpy).toHaveBeenCalled();
    const calls = warnSpy.mock.calls.map((c) => c.join(" "));
    expect(calls.some((msg) => msg.includes("NONEXISTENT_COMMAND"))).toBe(true);
  });

  it("#2 warning includes the scope chain that was searched", () => {
    const kernel = createKernel({});

    const scope = defineScope("my-app");
    kernel.group({ scope });

    kernel.dispatch({
      type: "MISSING_CMD",
      scope: [scope],
    } as any);

    const calls = warnSpy.mock.calls.map((c) => c.join(" "));
    const relevant = calls.find((msg) => msg.includes("MISSING_CMD"));
    expect(relevant).toBeDefined();
    expect(relevant).toContain("my-app");
  });

  it("#3 no warning when command IS handled", () => {
    const kernel = createKernel({});

    kernel.defineCommand("HANDLED_CMD", () => () => ({}));
    kernel.dispatch({ type: "HANDLED_CMD" });

    const calls = warnSpy.mock.calls.map((c) => c.join(" "));
    expect(calls.some((msg) => msg.includes("No handler"))).toBe(false);
  });
});
