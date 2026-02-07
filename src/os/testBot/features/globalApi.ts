/**
 * TestBot — Global API for AI/LLM agents (window.__TESTBOT__)
 *
 * Provides programmatic access to TestBot from the browser console
 * or AI agent integrations.
 */

import type { SuiteResult } from "../entities/SuiteResult";
import { TestBotActions } from "./TestBotActions";
import { useTestBotStore } from "./TestBotStore";

// ═══════════════════════════════════════════════════════════════════
// Global Registration
// ═══════════════════════════════════════════════════════════════════

// ── Helpers ────────────────────────────────────────────────────────

function formatSuite(s: SuiteResult) {
  return {
    name: s.name,
    status: s.status,
    passed: s.passed,
    steps: s.steps.map((step) => ({
      action: step.action,
      detail: step.detail,
      passed: step.passed,
      error: step.error || null,
    })),
  };
}

function getState() {
  return useTestBotStore.getState();
}

function findSuiteIndex(name: string): number {
  const { suites } = getState();
  const idx = suites.findIndex((s) => s.name === name);
  if (idx < 0)
    throw new Error(
      `Suite "${name}" not found. Available: ${suites.map((s) => s.name).join(", ")}`,
    );
  return idx;
}

// ── Global API ─────────────────────────────────────────────────────

(window as any).__TESTBOT__ = {
  // ── Run ──────────────────────────────────────────────────────────

  /** Run all test suites */
  runAll: () => TestBotActions.runAll(),

  /** Run a single suite by index */
  runSuite: (i: number) => TestBotActions.runSuite(i),

  /** Run a single suite by exact name */
  runByName: (name: string) => TestBotActions.runSuite(findSuiteIndex(name)),

  /** Re-run only previously failed suites (sequential) */
  rerunFailed: async () => {
    const { suites, isRunning } = getState();
    if (isRunning) return;

    const failedIndices = suites
      .map((s, i) => (s.status === "done" && !s.passed ? i : -1))
      .filter((i) => i >= 0);

    if (failedIndices.length === 0) {
      console.log("✅ No failed suites to re-run.");
      return;
    }

    console.log(
      `🔄 Re-running ${failedIndices.length} failed suite(s): ${failedIndices.map((i) => suites[i].name).join(", ")}`,
    );

    for (const idx of failedIndices) {
      await TestBotActions.runSuite(idx);
    }
  },

  // ── Query ────────────────────────────────────────────────────────

  /** Get structured results as JSON (all suites) */
  getResults: () => {
    const { suites, isRunning } = getState();
    return {
      isRunning,
      summary: {
        total: suites.length,
        pass: suites.filter((s) => s.passed).length,
        fail: suites.filter((s) => s.status === "done" && !s.passed).length,
      },
      suites: suites.map(formatSuite),
    };
  },

  /** Get only failed suites with error details */
  getFailures: () => {
    const { suites } = getState();
    const failed = suites.filter((s) => s.status === "done" && !s.passed);
    return failed.map((s) => ({
      name: s.name,
      failedStep: (() => {
        const step = s.steps.find((st) => !st.passed);
        if (!step) return null;
        return {
          index: s.steps.indexOf(step) + 1,
          action: step.action,
          detail: step.detail,
          error: step.error || null,
        };
      })(),
    }));
  },

  /** One-liner summary string: "PASS: 8 / FAIL: 4 / TOTAL: 12" */
  summary: () => {
    const { suites } = getState();
    const pass = suites.filter((s) => s.passed).length;
    const fail = suites.filter((s) => s.status === "done" && !s.passed).length;
    return `PASS: ${pass} / FAIL: ${fail} / TOTAL: ${suites.length}`;
  },

  /** Check if tests are currently running */
  isRunning: () => getState().isRunning,

  /** List all registered suite names */
  listSuites: () => getState().suites.map((s) => s.name),
};
