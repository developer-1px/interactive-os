/**
 * @spec docs/1-project/inspector/testbot-zift/spec.md
 *
 * TestBot Panel V2 — ZIFT accordion + toolbar headless verification.
 *
 * This test verifies that TestBot panel can be built with OS ZIFT primitives
 * (Zone/Item/Trigger) and operated entirely via headless page API.
 * OS gap discovery is an explicit goal.
 */

import type { TestBotState } from "@apps/testbot/app";
import { initSuites, TestBotApp } from "@apps/testbot/app";
import { TestBotPanelV2 } from "@inspector/panels/TestBotPanelV2";
import { createHeadlessPage } from "@os-devtool/testing/page";
import type { AppPage } from "@os-sdk/app/defineApp/types";
import { beforeEach, describe, it, expect as vitestExpect } from "vitest";

// Ensure zones are registered by importing the module
import "@apps/testbot/zones";

describe("Feature: TestBot Panel ZIFT", () => {
  let page: AppPage<TestBotState>;

  const SUITES = [
    { name: "Listbox Nav", group: "APG" },
    { name: "Toolbar Loop", group: "APG" },
    { name: "Grid Select", group: "APG" },
  ];

  beforeEach(() => {
    page = createHeadlessPage(TestBotApp, TestBotPanelV2);

    // Seed suites into kernel state
    (page as unknown as { dispatch: (cmd: unknown) => void }).dispatch(
      initSuites({ scripts: SUITES }),
    );

    page.goto("/");
  });

  // ═══════════════════════════════════════════════════════════════
  // S1: Initial state — 3 items, all collapsed
  // ═══════════════════════════════════════════════════════════════

  it("S1 — accordion has 3 items, all collapsed", () => {
    for (const suite of SUITES) {
      const loc = page.locator(`#${cssId(suite.name)}`);
      vitestExpect(loc.getAttribute("aria-expanded")).toBe("false");
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // S2: ArrowDown navigation
  // ═══════════════════════════════════════════════════════════════

  it("S2 — ArrowDown moves focus to next suite", () => {
    page.locator(`#${cssId(SUITES[0]!.name)}`).click();
    page.keyboard.press("ArrowDown");

    const focused = page.locator(`#${cssId(SUITES[1]!.name)}`);
    vitestExpect(focused.getAttribute("data-focused")).toBe("true");
  });

  // ═══════════════════════════════════════════════════════════════
  // S3: Enter expands (click focuses without toggling expand state)
  // Note: accordion click also toggles expand per APG spec.
  // So we use ArrowDown to focus without toggling, then Enter.
  // ═══════════════════════════════════════════════════════════════

  it("S3 — Enter expands focused suite", () => {
    // Click first item (toggles expand ON), then collapse via Enter
    page.locator(`#${cssId(SUITES[0]!.name)}`).click();
    page.keyboard.press("Enter"); // collapse (click already expanded)
    vitestExpect(
      page.locator(`#${cssId(SUITES[0]!.name)}`).getAttribute("aria-expanded"),
    ).toBe("false");

    // Now Enter should expand it again
    page.keyboard.press("Enter");
    vitestExpect(
      page.locator(`#${cssId(SUITES[0]!.name)}`).getAttribute("aria-expanded"),
    ).toBe("true");
  });

  // ═══════════════════════════════════════════════════════════════
  // S4: Enter collapses
  // ═══════════════════════════════════════════════════════════════

  it("S4 — Enter collapses expanded suite", () => {
    // Click expands
    page.locator(`#${cssId(SUITES[0]!.name)}`).click();
    vitestExpect(
      page.locator(`#${cssId(SUITES[0]!.name)}`).getAttribute("aria-expanded"),
    ).toBe("true");

    // Enter collapses
    page.keyboard.press("Enter");
    vitestExpect(
      page.locator(`#${cssId(SUITES[0]!.name)}`).getAttribute("aria-expanded"),
    ).toBe("false");
  });

  // ═══════════════════════════════════════════════════════════════
  // S5: Boundary clamp (accordion loop=false)
  // ═══════════════════════════════════════════════════════════════

  it("S5 — ArrowDown at last item stays at last", () => {
    page.locator(`#${cssId(SUITES[2]!.name)}`).click();
    page.keyboard.press("ArrowDown");

    const focused = page.locator(`#${cssId(SUITES[2]!.name)}`);
    vitestExpect(focused.getAttribute("data-focused")).toBe("true");
  });

  // ═══════════════════════════════════════════════════════════════
  // S6: Home/End
  // ═══════════════════════════════════════════════════════════════

  it("S6 — Home goes to first, End goes to last", () => {
    page.locator(`#${cssId(SUITES[1]!.name)}`).click();

    page.keyboard.press("Home");
    vitestExpect(
      page.locator(`#${cssId(SUITES[0]!.name)}`).getAttribute("data-focused"),
    ).toBe("true");

    page.keyboard.press("End");
    vitestExpect(
      page.locator(`#${cssId(SUITES[2]!.name)}`).getAttribute("data-focused"),
    ).toBe("true");
  });
});

describe("Feature: TestBot Toolbar", () => {
  // T1 and T2 will be added in /green or next red iteration
  // Toolbar requires onAction callback wiring which is implementation detail

  it.todo("T1 — ArrowRight moves focus between toolbar buttons");
  it.todo("T2 — Enter on Run All triggers executeAll");
});

// ── Helpers ──────────────────────────────────────────────────────

/** Convert suite name to a valid CSS ID */
function cssId(name: string): string {
  return `tb-${name.replace(/\s+/g, "-").toLowerCase()}`;
}
