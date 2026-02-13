/**
 * inferPipeline — Unit Tests
 *
 * 순수함수 증명: Transaction → PipelineStep[]
 * 입력(Transaction) → 출력(6-domino 상태) 검증.
 */

import {
  inferPipeline,
  type PipelineStep,
} from "@inspector/panels/UnifiedInspector";
import type { Transaction } from "@os/schema";
import { describe, expect, it } from "vitest";

// ─── Helpers ───

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    timestamp: Date.now(),
    command: { type: "FOCUS.NEXT", payload: {} },
    handlerScope: "listView",
    bubblePath: ["listView"],
    effects: null,
    changes: [],
    stateBefore: {},
    stateAfter: {},
    meta: {
      input: { type: "KEYBOARD", key: "ArrowDown", code: "ArrowDown" },
    },
    ...overrides,
  };
}

function stepNames(steps: PipelineStep[]): string[] {
  return steps.map((s) => s.name);
}

function stepStatuses(steps: PipelineStep[]): string[] {
  return steps.map((s) => s.status);
}

// ─── Tests ───

describe("inferPipeline", () => {
  it("returns 6 domino steps in correct order", () => {
    const steps = inferPipeline(makeTx());
    expect(stepNames(steps)).toEqual([
      "Input",
      "Dispatch",
      "Command",
      "State",
      "Effect",
      "Render",
    ]);
  });

  it("full pipeline with changes: all pass except Effect (skip)", () => {
    const tx = makeTx({
      changes: [{ path: "focus.activeId", from: "a", to: "b" }],
    });
    const statuses = stepStatuses(inferPipeline(tx));
    expect(statuses).toEqual(["pass", "pass", "pass", "pass", "skip", "pass"]);
  });

  it("full pipeline with effects: Effect passes", () => {
    const tx = makeTx({
      changes: [{ path: "x", from: 0, to: 1 }],
      effects: { "dom.scrollIntoView": true },
    });
    const statuses = stepStatuses(inferPipeline(tx));
    expect(statuses).toEqual(["pass", "pass", "pass", "pass", "pass", "pass"]);
  });

  it("no input meta: Input and Dispatch are skip", () => {
    const tx = makeTx({ meta: undefined });
    const statuses = stepStatuses(inferPipeline(tx));
    expect(statuses[0]).toBe("skip"); // Input
    expect(statuses[1]).toBe("skip"); // Dispatch
    expect(statuses[2]).toBe("pass"); // Command still exists
  });

  it("no command: Command fails, downstream skips", () => {
    const tx = makeTx({
      command: { type: "", payload: null },
    });
    const statuses = stepStatuses(inferPipeline(tx));
    expect(statuses[2]).toBe("fail"); // Command
    expect(statuses[3]).toBe("skip"); // State
    expect(statuses[4]).toBe("skip"); // Effect
  });

  it("no changes: State and Render skip", () => {
    const tx = makeTx({ changes: [] });
    const statuses = stepStatuses(inferPipeline(tx));
    expect(statuses[3]).toBe("skip"); // State
    expect(statuses[5]).toBe("skip"); // Render
  });

  it("null changes: does not throw", () => {
    // biome-ignore lint/suspicious/noExplicitAny: testing runtime null safety
    const tx = makeTx({ changes: null as any });
    expect(() => inferPipeline(tx)).not.toThrow();
    const statuses = stepStatuses(inferPipeline(tx));
    expect(statuses[3]).toBe("skip"); // State
  });

  it("null effects: does not throw", () => {
    const tx = makeTx({ effects: null });
    expect(() => inferPipeline(tx)).not.toThrow();
    const statuses = stepStatuses(inferPipeline(tx));
    expect(statuses[4]).toBe("skip"); // Effect
  });

  it("detail shows change count", () => {
    const tx = makeTx({
      changes: [
        { path: "a", from: 0, to: 1 },
        { path: "b", from: "x", to: "y" },
      ],
    });
    const steps = inferPipeline(tx);
    const stateStep = steps.find((s) => s.name === "State");
    expect(stateStep).toBeDefined();
    expect(stateStep?.detail).toBe("Δ2");
  });

  it("detail shows effect count", () => {
    const tx = makeTx({
      effects: { scroll: true, focus: true, announce: true },
    });
    const steps = inferPipeline(tx);
    const effectStep = steps.find((s) => s.name === "Effect");
    expect(effectStep).toBeDefined();
    expect(effectStep?.detail).toBe("3 fx");
  });

  it("detail shows input key", () => {
    const tx = makeTx({
      meta: { input: { type: "KEYBOARD", key: "Enter", code: "Enter" } },
    });
    const steps = inferPipeline(tx);
    expect(steps[0].detail).toBe("Enter");
  });

  it("detail shows handler scope for Dispatch", () => {
    const tx = makeTx({ handlerScope: "sidebarZone" });
    const steps = inferPipeline(tx);
    expect(steps[1].detail).toBe("sidebarZone");
  });
});
