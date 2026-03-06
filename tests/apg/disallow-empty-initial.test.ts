/**
 * T1: disallowEmpty — config-driven initial selection
 *
 * @spec docs/1-project/eliminate-layout-dispatch/spec.md §T1
 *
 * Verifies that disallowEmpty zones auto-select their first item
 * WITHOUT useLayoutEffect dispatch. The selection must be applied
 * at zone registration time (ensureZone), not at React mount.
 *
 * Input-First: These tests use page.goto() which exercises the
 * full registration pipeline, not direct command dispatch.
 */

import { defineApp } from "@os-sdk/app/defineApp/index";
import { createPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// S1: tablist — mount 시 첫 번째 탭 자동 선택
// ═══════════════════════════════════════════════════════════════════

describe("T1-S1: tablist disallowEmpty auto-selects first tab", () => {
  it("tab-1 has aria-selected=true after goto", () => {
    const app = defineApp("test-disallow-empty-s1", {});
    const zone = app.createZone("tab-zone");
    zone.bind({
      role: "tablist",
      getItems: () => ["tab-1", "tab-2", "tab-3"],
    });
    const page = createPage(app);
    page.goto("tab-zone", { focusedItemId: "tab-1" });

    expect(page.attrs("tab-1")["aria-selected"]).toBe(true);
  });

  it("tab-2 and tab-3 are NOT selected", () => {
    const app = defineApp("test-disallow-empty-s1b", {});
    const zone = app.createZone("tab-zone-2");
    zone.bind({
      role: "tablist",
      getItems: () => ["tab-1", "tab-2", "tab-3"],
    });
    const page = createPage(app);
    page.goto("tab-zone-2", { focusedItemId: "tab-1" });

    expect(page.attrs("tab-2")["aria-selected"]).toBe(false);
    expect(page.attrs("tab-3")["aria-selected"]).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// S2: radiogroup — mount 시 첫 번째 라디오 자동 선택
// ═══════════════════════════════════════════════════════════════════

describe("T1-S2: radiogroup disallowEmpty auto-selects first radio", () => {
  it("r-1 has aria-checked=true after goto", () => {
    const app = defineApp("test-disallow-empty-s2", {});
    const zone = app.createZone("radio-zone");
    zone.bind({
      role: "radiogroup",
      getItems: () => ["r-1", "r-2"],
    });
    const page = createPage(app);
    page.goto("radio-zone", { focusedItemId: "r-1" });

    // radiogroup uses aria-checked, not aria-selected
    expect(page.attrs("r-1")["aria-checked"]).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// S3: disallowEmpty=false — 자동 선택 안 함
// ═══════════════════════════════════════════════════════════════════

describe("T1-S3: listbox (disallowEmpty=false) does NOT auto-select", () => {
  it("no item has aria-selected=true", () => {
    const app = defineApp("test-disallow-empty-s3", {});
    const zone = app.createZone("list-zone");
    zone.bind({
      role: "listbox",
      getItems: () => ["opt-1", "opt-2"],
    });
    const page = createPage(app);
    page.goto("list-zone", { focusedItemId: "opt-1" });

    expect(page.attrs("opt-2")["aria-selected"]).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// S4: 이미 선택이 있는 Zone — 중복 선택 안 함
// ═══════════════════════════════════════════════════════════════════

describe("T1-S4: existing selection preserved (no overwrite)", () => {
  it("tab-2 remains selected when initial.selection specifies it", () => {
    const app = defineApp("test-disallow-empty-s4", {});
    const zone = app.createZone("tab-zone-3");
    zone.bind({
      role: "tablist",
      getItems: () => ["tab-1", "tab-2"],
    });
    const page = createPage(app);
    page.goto("tab-zone-3", {
      focusedItemId: "tab-1",
      initial: { selection: ["tab-2"] },
    });

    expect(page.attrs("tab-2")["aria-selected"]).toBe(true);
    expect(page.attrs("tab-1")["aria-selected"]).toBe(false);
  });
});
