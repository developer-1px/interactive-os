/**
 * TestBot — Core Orchestrator
 *
 * Lightweight visual test runner for in-app interaction testing.
 * Dispatches real DOM events while showing a virtual cursor.
 */

import type { StepResult } from "../entities/StepResult";
import type { OnProgress, OnStep, SuiteResult } from "../entities/SuiteResult";
import type { TestActions } from "../entities/TestActions";
import type { TestBot } from "../entities/TestBot";
import { createActions, createMockActions, wait } from "./actions";
import { createCursor } from "./cursor";

// Re-export entities for backward compatibility
export type {
  TestBot,
  TestActions,
  SuiteResult,
  StepResult,
  OnProgress,
  OnStep,
};

export function testBot(opts?: { speed?: number }): TestBot {
  const speed = opts?.speed ?? 1;
  const suites: { name: string; fn: (t: TestActions) => Promise<void> }[] = [];
  let cursor: ReturnType<typeof createCursor> | null = null;
  let aborted = false;

  const describe = (name: string, fn: (t: TestActions) => Promise<void>) => {
    suites.push({ name, fn });
  };

  const dryRun = async (): Promise<SuiteResult[]> => {
    const results: SuiteResult[] = [];
    for (const suite of suites) {
      const steps: StepResult[] = [];
      try {
        await suite.fn(createMockActions(steps));
      } catch {
        steps.push({ action: "error", detail: "Dry run error", passed: false });
      }
      results.push({
        name: suite.name,
        steps,
        passed: false,
        status: "planned",
      });
    }
    return results;
  };

  /** Execute a single suite, returns its result */
  const executeSuite = async (
    suite: (typeof suites)[0],
    suiteIndex: number,
    onStep?: OnStep,
  ): Promise<SuiteResult> => {
    const steps: StepResult[] = [];
    const actions = createActions(steps, {
      cursor: cursor!,
      speed,
      onStep,
      suiteIndex,
    });

    try {
      await suite.fn(actions);
    } catch (e) {
      if (!(e instanceof Error) || e.name !== "BotError") {
        steps.push({
          action: "error",
          detail: String(e),
          passed: false,
          error: String(e),
        });
        onStep?.(suiteIndex, steps[steps.length - 1]);
      }
    }

    const passed = steps.length > 0 && steps.every((s) => s.passed);
    return { name: suite.name, steps, passed, status: "done" };
  };

  const runAll = async (
    onProgress?: OnProgress,
    onStep?: OnStep,
  ): Promise<SuiteResult[]> => {
    cursor = createCursor();
    aborted = false;
    const results: SuiteResult[] = [];

    let suiteIndex = 0;
    for (const suite of suites) {
      if (aborted) break;
      const result = await executeSuite(suite, suiteIndex, onStep);
      results.push(result);
      onProgress?.([...results]);
      await wait(200 / speed);
      suiteIndex++;
    }

    cursor?.destroy();
    cursor = null;
    return results;
  };

  const runSuite = async (
    index: number,
    onStep?: OnStep,
  ): Promise<SuiteResult> => {
    const suite = suites[index];
    if (!suite)
      throw new Error(
        `Suite index ${index} out of range (${suites.length} suites)`,
      );

    cursor = createCursor();
    aborted = false;

    const result = await executeSuite(suite, index, onStep);

    cursor?.destroy();
    cursor = null;
    return result;
  };

  const destroy = () => {
    aborted = true;
    cursor?.destroy();
    cursor = null;
  };

  return { describe, runAll, runSuite, dryRun, destroy };
}
