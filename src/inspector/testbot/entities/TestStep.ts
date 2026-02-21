/**
 * TestStep — Recorded test execution steps for TestBot v2 replay.
 *
 * During vitest --browser execution, pressKey/click/attrs calls are
 * recorded as TestStep entries. After tests complete, the full recording
 * is written to a JSON file for visual replay in the TestBot panel.
 *
 * Design:
 *   - Record phase: fast, synchronous, zero overhead on test logic
 *   - Replay phase: async, animated, human-speed playback
 *   - Separation: tests don't know about recording (decorator pattern)
 */

// ═══════════════════════════════════════════════════════════════════
// Step Types
// ═══════════════════════════════════════════════════════════════════

export interface PressKeyStep {
    type: "pressKey";
    key: string;
    focusedBefore: string | null;
    focusedAfter: string | null;
    timestamp: number;
}

export interface ClickStep {
    type: "click";
    itemId: string;
    focusedAfter: string | null;
    timestamp: number;
}

export interface AttrsStep {
    type: "attrs";
    itemId: string;
    result: Record<string, unknown>;
    timestamp: number;
}

export interface SuiteStartStep {
    type: "suite:start";
    name: string;
    timestamp: number;
}

export interface SuiteEndStep {
    type: "suite:end";
    name: string;
    timestamp: number;
}

export interface TestStartStep {
    type: "test:start";
    name: string;
    timestamp: number;
}

export interface TestEndStep {
    type: "test:end";
    name: string;
    status: "pass" | "fail";
    error?: string;
    duration: number;
    timestamp: number;
}

export type TestStep =
    | PressKeyStep
    | ClickStep
    | AttrsStep
    | SuiteStartStep
    | SuiteEndStep
    | TestStartStep
    | TestEndStep;

// ═══════════════════════════════════════════════════════════════════
// Recording — per-file result
// ═══════════════════════════════════════════════════════════════════

export interface TestRecording {
    file: string;
    startedAt: number;
    duration: number;
    steps: TestStep[];
    summary: {
        total: number;
        passed: number;
        failed: number;
    };
}

export interface TestBotReport {
    version: 2;
    createdAt: string;
    recordings: TestRecording[];
}
