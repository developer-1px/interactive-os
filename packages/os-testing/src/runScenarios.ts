/**
 * runScenarios — TestScenario[] → vitest describe/it auto-registration.
 *
 * Bridges testbot-*.ts scenarios to vitest. Each scenario becomes a
 * describe() block, and each script becomes an it().
 *
 * Usage:
 *   import { runScenarios } from "@os-testing/runScenarios";
 *   import { scenarios } from "./testbot-myapp";
 *   import { MyApp } from "./app";
 *   runScenarios(scenarios, MyApp);
 *
 * "Write once, run anywhere" — same TestScript runs in:
 *   1. vitest headless (via this runner)
 *   2. browser TestBot (via TestBotRegistry)
 *   3. Playwright E2E (native page)
 */

import type { AppHandle } from "@os-sdk/app/defineApp/types";
import type { FC } from "react";
import { describe, it } from "vitest";
import { expect } from "./expect";
import { setActiveZoneFilter } from "./lib/locator";
import { createPage } from "./page";
import type { TestScenario } from "./scripts";

/**
 * Register TestScenario[] as vitest describe/it blocks.
 *
 * Tier 2 (app integration): createPage(app, component) + goto("/")
 * registers all zones from the app's defineApp bindings.
 * Items are resolved from ZoneRegistry (same path as browser TestBot).
 *
 * Pass `component` when zones rely on projection for items
 * (no explicit getItems binding — items discovered via renderToString).
 */
export function runScenarios<S>(
  scenarios: TestScenario[],
  app: AppHandle<S>,
  component?: FC,
): void {
  for (const scenario of scenarios) {
    const label = `${scenario.role} — ${scenario.zone}`;

    describe(label, () => {
      for (const script of scenario.scripts) {
        if (script.todo) {
          it.todo(script.name);
          continue;
        }
        it(script.name, async () => {
          const { page, cleanup } = createPage(app, component);
          page.goto("/");
          setActiveZoneFilter(scenario.zone);
          try {
            await script.run(page, expect);
          } finally {
            setActiveZoneFilter(null);
            cleanup();
          }
        });
      }
    });
  }
}
