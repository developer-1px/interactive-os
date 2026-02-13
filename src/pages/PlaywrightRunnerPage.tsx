/**
 * Playwright E2E Runner Page
 *
 * Loads ALL Playwright specs at once for debugging.
 * For per-component mounting, use `usePlaywrightSpec` in individual pages.
 */

import { usePlaywrightSpecs } from "@inspector/testbot/playwright/loader";
// @ts-expect-error
import runComplexPatterns from "./aria-showcase/tests/e2e/complex-patterns.spec.ts";
// @ts-expect-error
import runDisclosure from "./aria-showcase/tests/e2e/disclosure.spec.ts";
// @ts-expect-error
import runGrid from "./aria-showcase/tests/e2e/grid.spec.ts";
// @ts-expect-error
import runListbox from "./aria-showcase/tests/e2e/listbox.spec.ts";
// @ts-expect-error
import runMenu from "./aria-showcase/tests/e2e/menu.spec.ts";
// @ts-expect-error
import runRadiogroup from "./aria-showcase/tests/e2e/radiogroup.spec.ts";
// @ts-expect-error
import runTabs from "./aria-showcase/tests/e2e/tabs.spec.ts";
// @ts-expect-error
import runToolbar from "./aria-showcase/tests/e2e/toolbar.spec.ts";
// @ts-expect-error
import runTree from "./aria-showcase/tests/e2e/tree.spec.ts";
// Import all specs — Vite plugin wraps them in functions
// @ts-expect-error
import runBuilderSpatial from "../apps/builder/tests/e2e/builder-spatial.spec.ts";
// @ts-expect-error
import runFocusShowcase from "./focus-showcase/tests/e2e/focus-showcase.spec.ts";
// @ts-expect-error
import runTodo from "../apps/todo/tests/e2e/todo.spec.ts";

export default function PlaywrightRunnerPage() {
  // Register all specs
  usePlaywrightSpecs("playwright-runner", [
    runTabs,
    runMenu,
    runDisclosure,
    runGrid,
    runListbox,
    runRadiogroup,
    runToolbar,
    runTree,
    runComplexPatterns,
    runFocusShowcase,
    runBuilderSpatial,
    runTodo,
  ]);

  return (
    <div className="p-8 text-center text-slate-500">
      <h1 className="text-xl font-bold mb-2">Playwright E2E Runner</h1>
      <p>All 12 spec files loaded.</p>
      <p className="text-sm mt-4">
        Open the <strong>TestBot</strong> panel to run tests.
      </p>
    </div>
  );
}
