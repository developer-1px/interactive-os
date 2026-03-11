/**
 * disallowEmpty — config-driven initial selection (Playwright 동형)
 *
 * 1경계: page = 유일한 테스트 API.
 * Action: page.goto / page.click
 * Assert: page.locator → toHaveAttribute
 *
 * Verifies that disallowEmpty zones auto-select their first item
 * at zone registration time (page.goto), not at React mount.
 */

import { defineApp } from "@os-sdk/app/defineApp/index";
import { expect as osExpect } from "@os-testing/expect";
import { createPage } from "@os-testing/page";
import { describe, it } from "vitest";

const expect = osExpect;

// ═══════════════════════════════════════════════════
// S1: tablist — goto 시 첫 번째 탭 자동 선택
// ═══════════════════════════════════════════════════

describe("T1-S1: tablist disallowEmpty auto-selects first tab", () => {
  it("tab-1 has aria-selected=true after goto", async () => {
    const app = defineApp("test-disallow-empty-s1", {});
    const zone = app.createZone("tab-zone");
    zone.bind("tablist", {
      getItems: () => ["tab-1", "tab-2", "tab-3"],
    });
    const { page, cleanup } = createPage(app);
    page.goto("/");

    await expect(page.locator("#tab-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    cleanup();
  });

  it("tab-2 and tab-3 are NOT selected", async () => {
    const app = defineApp("test-disallow-empty-s1b", {});
    const zone = app.createZone("tab-zone-2");
    zone.bind("tablist", {
      getItems: () => ["tab-1", "tab-2", "tab-3"],
    });
    const { page, cleanup } = createPage(app);
    page.goto("/");

    await expect(page.locator("#tab-2")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.locator("#tab-3")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// S2: radiogroup — goto 시 첫 번째 라디오 자동 선택
// ═══════════════════════════════════════════════════

describe("T1-S2: radiogroup disallowEmpty auto-selects first radio", () => {
  it("r-1 has aria-checked=true after goto", async () => {
    const app = defineApp("test-disallow-empty-s2", {});
    const zone = app.createZone("radio-zone");
    zone.bind("radiogroup", {
      getItems: () => ["r-1", "r-2"],
    });
    const { page, cleanup } = createPage(app);
    page.goto("/");

    await expect(page.locator("#r-1")).toHaveAttribute("aria-checked", "true");
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// S3: listbox (disallowEmpty=false) — 자동 선택 안 함
// ═══════════════════════════════════════════════════

describe("T1-S3: listbox (disallowEmpty=false) does NOT auto-select", () => {
  it("no item has aria-selected=true", async () => {
    const app = defineApp("test-disallow-empty-s3", {});
    const zone = app.createZone("list-zone");
    zone.bind("listbox", {
      getItems: () => ["opt-1", "opt-2"],
    });
    const { page, cleanup } = createPage(app);
    page.goto("/");

    await expect(page.locator("#opt-2")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// S4: disallowEmpty + user selection change
// ═══════════════════════════════════════════════════

describe("T1-S4: disallowEmpty respects user selection change", () => {
  it("clicking tab-2 selects it and deselects tab-1", async () => {
    const app = defineApp("test-disallow-empty-s4", {});
    const zone = app.createZone("tab-zone-3");
    zone.bind("tablist", {
      getItems: () => ["tab-1", "tab-2"],
    });
    const { page, cleanup } = createPage(app);
    page.goto("/");

    // disallowEmpty auto-selected tab-1
    await expect(page.locator("#tab-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // User clicks tab-2
    page.click("tab-2");
    await expect(page.locator("#tab-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#tab-1")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });
});
