/**
 * runScenarios — Vitest auto-runner for TestScenario[].
 *
 * Eliminates hand-written boilerplate test files.
 * Each TestScenario maps to a vitest describe block:
 *
 *   // OS-level (zone only, no app)
 *   import { runScenarios } from "@os-devtool/testing/runScenarios";
 *   import { scenarios } from "../../testbot-docs";
 *   runScenarios(scenarios);
 *
 *   // App-level (with React projection)
 *   import { runScenarios } from "@os-devtool/testing/runScenarios";
 *   import { scenarios } from "../../testbot-todo";
 *   import { TodoApp } from "@apps/todo/app";
 *   import { TodoView } from "@apps/todo/TodoView";
 *   runScenarios(scenarios, { app: TodoApp, component: TodoView });
 *
 * That's it. No manual describe/it/goto/cleanup wiring.
 */

import type { AppHandle } from "@os-sdk/app/defineApp/types";
import type { FC } from "react";
import { afterEach, describe, it } from "vitest";
import { createHeadlessPage } from "./createHeadlessPage";
import { expect } from "./expect";
import { createPage } from "./page";
import type { TestScenario } from "./scripts";

interface RunScenariosOptions {
  /** App handle — enables app-level page with zone bindings auto-resolved */
  app?: AppHandle<unknown>;
  /** React component — enables projection mode (renderToString verification) */
  component?: FC;
}

export function runScenarios(
  scenarios: TestScenario[],
  options?: RunScenariosOptions,
): void {
  if (options?.app) {
    runAppScenarios(scenarios, options.app, options.component);
  } else {
    runOsScenarios(scenarios);
  }
}

/** OS-level: createHeadlessPage + manual zone setup */
function runOsScenarios(scenarios: TestScenario[]): void {
  for (const scenario of scenarios) {
    describe(scenario.zone, () => {
      const page = createHeadlessPage();

      afterEach(() => {
        page.cleanup();
      });

      for (const script of scenario.scripts) {
        it(script.name, async () => {
          const items = scenario.getItems?.() ?? scenario.items ?? [];
          page.goto(scenario.zone, {
            items,
            role: scenario.role,
            ...(scenario.config !== undefined
              ? { config: scenario.config }
              : {}),
            ...(scenario.initial !== undefined
              ? { initial: scenario.initial }
              : {}),
          });
          await script.run(
            page as unknown as import("./types").Page,
            expect,
            items,
          );
        });
      }
    });
  }
}

/** App-level: createPage(app, component) + zone bindings from defineApp */
function runAppScenarios(
  scenarios: TestScenario[],
  app: AppHandle<unknown>,
  component?: FC,
): void {
  for (const scenario of scenarios) {
    describe(scenario.zone, () => {
      const page = createPage(app, component);

      afterEach(() => {
        page.cleanup();
      });

      for (const script of scenario.scripts) {
        it(script.name, async () => {
          const items = scenario.getItems?.() ?? scenario.items ?? [];
          page.goto(scenario.zone, {
            items,
            ...(scenario.config !== undefined
              ? { config: scenario.config }
              : {}),
            ...(scenario.initial !== undefined
              ? { initial: scenario.initial }
              : {}),
          });
          await script.run(
            page as unknown as import("./types").Page,
            expect,
            items,
          );
        });
      }
    });
  }
}
