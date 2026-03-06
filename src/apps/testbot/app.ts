/**
 * TestBot App — defineApp native.
 *
 * Structure:
 *   TestBotApp (defineApp)
 *     ├── State: suites[], isRunning, currentIndex
 *     ├── Commands: startRun, suiteStart, stepRecorded, suiteDone, allDone
 *     ├── Selectors: progress (passCount, failCount, isFinished)
 *     └── Runner: executeAll (async effect, dispatches commands)
 */

import type { BrowserStep, TestScript } from "@os-devtool/testing";
import {
  createBrowserPage,
  expect,
  getZoneItems,
  resetFocusState,
  TestBotRegistry,
} from "@os-devtool/testing";
import { formatDiagnostics } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp";
import { os } from "@os-sdk/os";
import { produce } from "immer";

// ═══════════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════════

export type SuiteStatus = "planned" | "running" | "done";

export interface SuiteState {
  name: string;
  group: string;
  status: SuiteStatus;
  passed: boolean;
  steps: BrowserStep[];
  diagnostics?: string;
}

export interface TestBotState {
  suites: SuiteState[];
  isRunning: boolean;
  currentIndex: number;
}

const INITIAL_STATE: TestBotState = {
  suites: [],
  isRunning: false,
  currentIndex: 0,
};

// ═══════════════════════════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════════════════════════

export const TestBotApp = defineApp<TestBotState>("testbot", INITIAL_STATE);

/** Read current TestBot state from kernel store */
export function getTestBotState(): TestBotState {
  return (os.getState() as { apps: Record<string, unknown> }).apps[
    "testbot"
  ] as TestBotState;
}

// ═══════════════════════════════════════════════════════════════════
// Commands — pure state transitions
// ═══════════════════════════════════════════════════════════════════

/** Initialize all suites as "planned" from script list.
 *  No-op if tests are currently running (prevents race from zone re-mount).
 *  No-op if names haven't changed (prevents result wipe from ref change). */
export const initSuites = TestBotApp.command(
  "testbot:initSuites",
  (ctx, payload: { scripts: { name: string; group: string }[] }) => {
    if (ctx.state.isRunning) return undefined;

    const currentNames = ctx.state.suites.map((s) => s.name);
    const payloadNames = payload.scripts.map((s) => s.name);
    if (
      currentNames.length === payloadNames.length &&
      currentNames.every((n, i) => n === payloadNames[i])
    ) {
      return undefined;
    }

    return {
      state: produce(ctx.state, (draft) => {
        draft.suites = payload.scripts.map((s) => ({
          name: s.name,
          group: s.group,
          status: "planned" as SuiteStatus,
          passed: false,
          steps: [],
        }));
        draft.isRunning = false;
        draft.currentIndex = 0;
      }),
    };
  },
);

/** Start a full run — sets all suites to planned, isRunning = true */
export const startRun = TestBotApp.command(
  "testbot:startRun",
  (ctx, payload: { scripts: { name: string; group: string }[] }) => ({
    state: produce(ctx.state, (draft) => {
      draft.suites = payload.scripts.map((s) => ({
        name: s.name,
        group: s.group,
        status: "planned" as SuiteStatus,
        passed: false,
        steps: [],
      }));
      draft.isRunning = true;
      draft.currentIndex = 0;
    }),
  }),
);

/** Mark suite i as running */
export const suiteStart = TestBotApp.command(
  "testbot:suiteStart",
  (ctx, payload: { index: number }) => ({
    state: produce(ctx.state, (draft) => {
      draft.currentIndex = payload.index;
      if (draft.suites[payload.index]) {
        draft.suites[payload.index]!.status = "running";
        draft.suites[payload.index]!.steps = [];
      }
    }),
  }),
);

/** Record a step for suite i */
export const stepRecorded = TestBotApp.command(
  "testbot:stepRecorded",
  (ctx, payload: { index: number; steps: BrowserStep[] }) => ({
    state: produce(ctx.state, (draft) => {
      if (draft.suites[payload.index]) {
        draft.suites[payload.index]!.steps = payload.steps;
      }
    }),
  }),
);

/** Mark suite i as done */
export const suiteDone = TestBotApp.command(
  "testbot:suiteDone",
  (
    ctx,
    payload: {
      index: number;
      passed: boolean;
      steps: BrowserStep[];
      diagnostics?: string;
    },
  ) => ({
    state: produce(ctx.state, (draft) => {
      if (draft.suites[payload.index]) {
        draft.suites[payload.index]!.status = "done";
        draft.suites[payload.index]!.passed = payload.passed;
        draft.suites[payload.index]!.steps = payload.steps;
        if (payload.diagnostics) {
          draft.suites[payload.index]!.diagnostics = payload.diagnostics;
        }
      }
    }),
  }),
);

/** Mark entire run as done */
export const allDone = TestBotApp.command("testbot:allDone", (ctx) => ({
  state: produce(ctx.state, (draft) => {
    draft.isRunning = false;
  }),
}));

// ═══════════════════════════════════════════════════════════════════
// Selectors
// ═══════════════════════════════════════════════════════════════════

export const progress = TestBotApp.selector("progress", (state) => {
  const doneSuites = state.suites.filter((s) => s.status === "done");
  return {
    passCount: doneSuites.filter((s) => s.passed).length,
    failCount: doneSuites.filter((s) => !s.passed).length,
    isFinished: !state.isRunning && doneSuites.length > 0,
    doneSuites,
  };
});

// ═══════════════════════════════════════════════════════════════════
// Runner — async effect (dispatches commands back to kernel)
// ═══════════════════════════════════════════════════════════════════

/** Get current active scripts from TestBotRegistry */
export function getActiveScripts(): TestScript[] {
  return TestBotRegistry.getScripts();
}

/**
 * Async test runner — executes scripts sequentially, dispatching state
 * transition commands at each step.
 *
 * This is the "effect" side of the TestBot app. Commands are pure state
 * transitions; this function orchestrates the async script execution.
 */
export async function executeAll(
  scripts: TestScript[],
  headless: boolean,
): Promise<void> {
  // Init: all planned, isRunning = true
  const scriptMeta = scripts.map((s) => ({
    name: s.name,
    group: s.group ?? "",
  }));
  os.dispatch(startRun({ scripts: scriptMeta }));

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];

    // Clear transaction log before each suite (isolate diagnostics per suite)
    os.inspector.clearTransactions();

    // Suite start
    os.dispatch(suiteStart({ index: i }));

    const steps: BrowserStep[] = [];
    const page = createBrowserPage(document.body, {
      ...(headless ? { headless: true } : { speed: 4 }),
      onStep: headless
        ? (step) => steps.push(step)
        : (step) => {
            steps.push(step);
            os.dispatch(stepRecorded({ index: i, steps: [...steps] }));
          },
    });

    let passed = true;
    try {
      resetFocusState();
      const items = script?.zone ? getZoneItems(script.zone) : [];
      await script?.run(page, expect, items);
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

    page.hideCursor();

    // Capture diagnostics on failure
    const diagnostics = !passed ? formatDiagnostics(os) : undefined;

    // Suite done
    os.dispatch(
      suiteDone({ index: i, passed, steps: [...steps], diagnostics }),
    );
  }

  // All done
  os.dispatch(allDone());
}

/**
 * Run a single suite by index.
 */
export async function executeSuite(
  scripts: TestScript[],
  si: number,
): Promise<void> {
  const script = scripts[si];
  if (!script) return;

  // Initialize suites if needed, then mark suite as running
  const scriptMeta = scripts.map((s) => ({
    name: s.name,
    group: s.group ?? "",
  }));
  os.dispatch(startRun({ scripts: scriptMeta }));
  // Override: only mark suite si as running, others stay planned
  os.inspector.clearTransactions();
  os.dispatch(suiteStart({ index: si }));

  const steps: BrowserStep[] = [];
  const page = createBrowserPage(document.body, {
    speed: 4,
    onStep: (step) => {
      steps.push(step);
      os.dispatch(stepRecorded({ index: si, steps: [...steps] }));
    },
  });

  let passed = true;
  try {
    const items = script.zone ? getZoneItems(script.zone) : [];
    await script.run(page, expect, items);
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

  page.hideCursor();

  const diagnostics = !passed ? formatDiagnostics(os) : undefined;
  os.dispatch(suiteDone({ index: si, passed, steps: [...steps], diagnostics }));
  os.dispatch(allDone());
}
