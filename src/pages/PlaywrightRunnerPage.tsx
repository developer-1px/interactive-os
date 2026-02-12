/**
 * Playwright E2E Runner Page
 *
 * Loads ALL Playwright specs at once for debugging.
 * For per-component mounting, use `usePlaywrightSpec` in individual pages.
 */

import { usePlaywrightSpecs } from "@inspector/testbot/playwright/loader";
// @ts-expect-error
import runComplexPatterns from "../../e2e/aria-showcase/complex-patterns.spec.ts";
// @ts-expect-error
import runDisclosure from "../../e2e/aria-showcase/disclosure.spec.ts";
// @ts-expect-error
import runGrid from "../../e2e/aria-showcase/grid.spec.ts";
// @ts-expect-error
import runListbox from "../../e2e/aria-showcase/listbox.spec.ts";
// @ts-expect-error
import runMenu from "../../e2e/aria-showcase/menu.spec.ts";
// @ts-expect-error
import runRadiogroup from "../../e2e/aria-showcase/radiogroup.spec.ts";
// @ts-expect-error
import runTabs from "../../e2e/aria-showcase/tabs.spec.ts";
// @ts-expect-error
import runToolbar from "../../e2e/aria-showcase/toolbar.spec.ts";
// @ts-expect-error
import runTree from "../../e2e/aria-showcase/tree.spec.ts";
// Import all specs — Vite plugin wraps them in functions
// @ts-expect-error
import runBuilderSpatial from "../../e2e/builder/builder-spatial.spec.ts";
// @ts-expect-error
import runFocusShowcase from "../../e2e/focus-showcase/focus-showcase.spec.ts";
// @ts-expect-error
import runTodo from "../../e2e/todo/todo.spec.ts";

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
