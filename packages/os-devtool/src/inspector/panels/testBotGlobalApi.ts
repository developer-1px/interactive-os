/**
 * TestBot Global API — window.__TESTBOT__
 *
 * Provides programmatic access to TestBot from:
 *   - Browser DevTools console
 *   - LLM/AI agent integrations
 *   - E2E automation bridges
 *
 * State is read from kernel store (TestBotApp.getState()).
 */

import { getTestBotState, type SuiteState } from "@os-devtool/testbot/app";
import {
  type BrowserStep,
  createBrowserPage,
  resetFocusState,
  TestBotRegistry,
} from "@os-devtool/testing";
import { expect } from "@os-testing/expect";
import type { TestScript } from "@os-testing/scripts";

// ═══════════════════════════════════════════════════════════════════
// Snapshot Types (for external consumers)
// ═══════════════════════════════════════════════════════════════════

export interface SuiteSnapshot {
  name: string;
  status: "planned" | "running" | "done";
  passed: boolean;
  steps: StepSnapshot[];
}

export interface StepSnapshot {
  action: string;
  detail: string;
  passed: boolean;
  error: string | null;
}

// ═══════════════════════════════════════════════════════════════════
// State Access — reads from kernel store
// ═══════════════════════════════════════════════════════════════════

// Module-level action bridges (set by TestBotPanel)
let _runAll: (() => void) | null = null;
let _runSuite: ((si: number) => void) | null = null;

/** Convert kernel state to API snapshot */
function toSnapshot(suite: SuiteState): SuiteSnapshot {
  return {
    name: suite.name,
    status: suite.status,
    passed: suite.passed,
    steps: suite.steps.map((st) => ({
      action: st.action,
      detail: st.detail,
      passed: st.result === "pass",
      error: st.error ?? null,
    })),
  };
}

/** Read current state from kernel store */
function getApiState() {
  const s = getTestBotState();
  return {
    isRunning: s.isRunning,
    suites: s.suites.map(toSnapshot),
    scripts: TestBotRegistry.getScripts().map((s) => ({ name: s.name })),
  };
}

// ═══════════════════════════════════════════════════════════════════
// Quick Run (headless, no visual effects)
// ═══════════════════════════════════════════════════════════════════

interface QuickResult {
  name: string;
  passed: boolean;
  steps: { action: string; detail: string; passed: boolean; error?: string }[];
  consoleLogs: string[];
}

async function quickRunScripts(scripts: TestScript[]): Promise<QuickResult[]> {
  const results: QuickResult[] = [];

  for (const script of scripts) {
    const steps: BrowserStep[] = [];
    const page = createBrowserPage(document.body, {
      headless: true,
      onStep: (step) => steps.push(step),
    });

    // Intercept console for per-suite capture
    const consoleLogs: string[] = [];
    const originals = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };
    function intercept(level: string) {
      return (...args: unknown[]) => {
        consoleLogs.push(`[${level}] ${args.map(String).join(" ")}`);
        originals[level as keyof typeof originals]?.(...args);
      };
    }
    console.log = intercept("log") as typeof console.log;
    console.warn = intercept("warn") as typeof console.warn;
    console.error = intercept("error") as typeof console.error;

    let passed = true;
    try {
      resetFocusState();
      await script.run(page, expect);
    } catch (e) {
      passed = false;
      steps.push({
        action: "assert",
        detail: String(e),
        result: "fail",
        error: String(e),
        timestamp: Date.now(),
      });
    }

    // Restore console
    console.log = originals.log;
    console.warn = originals.warn;
    console.error = originals.error;

    page.hideCursor();

    results.push({
      name: script.name,
      passed,
      steps: steps.map((s) => ({
        action: s.action,
        detail: s.detail,
        passed: s.result === "pass",
        ...(s.error !== undefined ? { error: s.error } : {}),
      })),
      consoleLogs,
    });
  }

  return results;
}

function printQuickResults(results: QuickResult[]) {
  const pass = results.filter((r) => r.passed).length;
  const fail = results.length - pass;

  console.log(
    `\n${fail === 0 ? "✅" : "❌"} TestBot Quick: ${pass}/${results.length} passed`,
  );

  for (const r of results) {
    if (r.passed) {
      console.log(`  ✅ ${r.name}`);
    } else {
      console.log(`  ❌ ${r.name}`);
      for (const step of r.steps) {
        if (!step.passed) {
          console.log(`     💥 [${step.action}] ${step.detail}`);
          if (step.error) console.log(`        → ${step.error}`);
        }
      }
    }

    if (r.consoleLogs.length > 0) {
      console.log(`     📋 Console (${r.consoleLogs.length} entries):`);
      for (const log of r.consoleLogs) {
        console.log(`        ${log}`);
      }
    }
  }
  console.log("");
}

// ═══════════════════════════════════════════════════════════════════
// Registration (called by TestBotPanel)
// ═══════════════════════════════════════════════════════════════════

export function registerTestBotGlobalApi(
  runAll: () => void,
  runSuite: (si: number) => void,
) {
  _runAll = runAll;
  _runSuite = runSuite;

  function findSuiteIndex(name: string): number {
    const state = getApiState();
    const idx = state.suites.findIndex((s) => s.name === name);
    if (idx < 0) {
      const available = state.scripts.map((s) => s.name).join(", ");
      throw new Error(`Suite "${name}" not found. Available: ${available}`);
    }
    return idx;
  }

  (window as unknown as Record<string, unknown>)["__TESTBOT__"] = {
    // ── Visual Run ───────────────────────────────────────────

    /** Run all test suites (with visual effects) */
    runAll: () => _runAll?.(),

    /** Run a single suite by index (with visual effects) */
    runSuite: (i: number) => _runSuite?.(i),

    /** Run a single suite by exact name (with visual effects) */
    runByName: (name: string) => _runSuite?.(findSuiteIndex(name)),

    // ── Quick Run (headless) ─────────────────────────────────

    /** 🚀 Quick run — no visuals, instant results */
    quickRun: async () => {
      const scripts = TestBotRegistry.getScripts();
      if (scripts.length === 0) {
        console.warn("[TestBot] No scripts available");
        return;
      }
      console.log(`⚡ Running ${scripts.length} tests headlessly...`);
      const results = await quickRunScripts(scripts);
      printQuickResults(results);
      return results;
    },

    /** 🚀 Quick run a single suite by name */
    quickRunByName: async (name: string) => {
      const scripts = TestBotRegistry.getScripts();
      const script = scripts.find((s) => s.name === name);
      if (!script) {
        console.warn(`[TestBot] Script "${name}" not found`);
        return;
      }
      console.log(`⚡ Quick: "${name}"...`);
      const results = await quickRunScripts([script]);
      printQuickResults(results);
      return results[0];
    },

    /** Re-run only previously failed suites */
    rerunFailed: async () => {
      const state = getApiState();
      if (state.isRunning) {
        console.warn("[TestBot] Already running");
        return;
      }
      const failedIndices = state.suites
        .map((s, i) => (s.status === "done" && !s.passed ? i : -1))
        .filter((i) => i >= 0);

      if (failedIndices.length === 0) {
        console.log("✅ [TestBot] No failed suites to re-run.");
        return;
      }

      const names = failedIndices.map((i) => state.suites[i]?.name).join(", ");
      console.log(`🔄 Re-running ${failedIndices.length} failed: ${names}`);

      for (const idx of failedIndices) {
        _runSuite?.(idx);
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (!getApiState().isRunning) {
              clearInterval(check);
              resolve();
            }
          }, 100);
        });
      }
    },

    // ── Query ────────────────────────────────────────────────

    /** Structured results (all suites) */
    getResults: () => {
      const state = getApiState();
      return {
        isRunning: state.isRunning,
        summary: {
          total: state.suites.length,
          pass: state.suites.filter((s) => s.passed).length,
          fail: state.suites.filter((s) => s.status === "done" && !s.passed)
            .length,
        },
        suites: state.suites,
      };
    },

    /** Only failed suites with first error detail */
    getFailures: () => {
      const state = getApiState();
      const failed = state.suites.filter(
        (s) => s.status === "done" && !s.passed,
      );
      return failed.map((s) => ({
        name: s.name,
        failedStep: (() => {
          const step = s.steps.find((st) => !st.passed);
          if (!step) return null;
          return {
            index: s.steps.indexOf(step) + 1,
            action: step.action,
            detail: step.detail,
            error: step.error,
          };
        })(),
      }));
    },

    /** "PASS: N / FAIL: N / DONE: N / TOTAL: N" */
    summary: () => {
      const state = getApiState();
      const done = state.suites.filter((s) => s.status === "done");
      const pass = done.filter((s) => s.passed).length;
      const fail = done.filter((s) => !s.passed).length;
      return `PASS: ${pass} / FAIL: ${fail} / DONE: ${done.length} / TOTAL: ${state.suites.length}`;
    },

    /** Currently running? */
    isRunning: () => getApiState().isRunning,

    /** List all script names */
    listSuites: () => getApiState().scripts.map((s) => s.name),

    /** Get results as JSON string (for LLM/agent parsing) */
    getJSON: () => {
      const state = getApiState();
      return JSON.stringify(
        {
          suites: state.suites.map((s) => ({
            name: s.name,
            passed: s.passed,
            steps: s.steps.map((st) => ({
              action: st.action,
              detail: st.detail,
              passed: st.passed,
              error: st.error,
            })),
          })),
        },
        null,
        2,
      );
    },
  };

  console.log(
    "[TestBot] 🤖 window.__TESTBOT__ registered.\n" +
      "  runAll() · quickRun() · getFailures() · summary()",
  );
}

export function unregisterTestBotGlobalApi() {
  delete (window as unknown as Record<string, unknown>)["__TESTBOT__"];
}
