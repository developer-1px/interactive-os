/**
 * runScenarios — TestScenario[] → vitest describe/it auto-registration.
 *
 * Bridges testbot-*.ts scenarios to vitest. Each scenario becomes a
 * describe() block, and each script becomes an it().
 *
 * Usage:
 *   import { runScenarios } from "@os-devtool/testing/runScenarios";
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
import { describe, it } from "vitest";
import { expect } from "./expect";
import { createHeadlessPage } from "./page";
import type { TestScenario } from "./scripts";

/**
 * Register TestScenario[] as vitest describe/it blocks.
 *
 * Tier 2 (app integration): createHeadlessPage(app) + goto("/")
 * registers all zones from the app's defineApp bindings.
 * Items are resolved from scenario.getItems() or scenario.items.
 */
export function runScenarios<S>(
  scenarios: TestScenario[],
  app: AppHandle<S>,
): void {
  for (const scenario of scenarios) {
    const label = `${scenario.role} — ${scenario.zone}`;

    describe(label, () => {
      for (const script of scenario.scripts) {
        it(script.name, async () => {
          const page = createHeadlessPage(app);
          page.goto("/");
          const items = scenario.getItems?.() ?? scenario.items ?? [];
          await script.run(page, expect, items);
        });
      }
    });
  }
}
