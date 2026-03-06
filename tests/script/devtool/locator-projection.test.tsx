/**
 * locator-projection — Component가 있을 때 locator()가 렌더 결과를 검증
 *
 * Playwright 모델: locator는 렌더된 페이지에서 요소를 찾는다.
 * Component가 없으면(headless only) OS 상태만 사용.
 * Component가 있으면 renderToString 결과에 해당 id가 존재해야 한다.
 */

import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it } from "vitest";

// ── Fixture: minimal app + zone ──

const ITEMS = ["item-a", "item-b", "item-c"];

function makeApp() {
  const app = defineApp("projection-test", { count: 0 });
  const zone = app.createZone("test-zone");
  zone.bind({
    role: "listbox",
    getItems: () => ITEMS,
    options: {
      navigate: {
        orientation: "vertical" as const,
        loop: false,
        seamless: false,
        typeahead: false,
        entry: "first" as const,
        recovery: "next" as const,
      },
      select: {
        mode: "single" as const,
        followFocus: true,
        disallowEmpty: false,
        range: false,
        toggle: false,
      },
    },
  });
  return app;
}

// ── Fixture: Component that renders items with ids ──

function TestComponent() {
  return (
    <ul>
      <li id="item-a">A</li>
      <li id="item-b">B</li>
      <li id="item-c">C</li>
    </ul>
  );
}

// ── Fixture: Component that renders NOTHING ──

function EmptyComponent() {
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// §1 No Component (headless only) — locator works from OS state
// ═══════════════════════════════════════════════════════════════════

describe("§1 headless only (no Component)", () => {
  it("locator resolves from OS state without Component", () => {
    const page = createPage(makeApp());
    page.goto("test-zone");
    page.click("item-a");

    // Should work — no projection check
    const loc = page.locator("#item-a");
    expect(loc.toBeFocused()).toBe(true);
    page.cleanup();
  });
});

// ═══════════════════════════════════════════════════════════════════
// §2 With Component — locator verifies element exists in render
// ═══════════════════════════════════════════════════════════════════

describe("§2 with Component — projection verification", () => {
  it("locator works when element exists in rendered output", () => {
    const page = createPage(makeApp(), TestComponent);
    page.goto("test-zone");
    page.click("item-a");

    // item-a exists in TestComponent's render → should work
    const loc = page.locator("#item-a");
    expect(loc.toBeFocused()).toBe(true);
    page.cleanup();
  });

  it("locator throws when element does NOT exist in rendered output", () => {
    const page = createPage(makeApp(), EmptyComponent);
    page.goto("test-zone");
    page.click("item-a");

    // EmptyComponent renders null → no elements → locator should throw
    expect(() => page.locator("#item-a")).toThrow();
    page.cleanup();
  });

  it("locator throws for non-existent id even with real Component", () => {
    const page = createPage(makeApp(), TestComponent);
    page.goto("test-zone");

    // "item-z" doesn't exist in TestComponent → should throw
    expect(() => page.locator("#item-z")).toThrow();
    page.cleanup();
  });
});

// ═══════════════════════════════════════════════════════════════════
// §3 query() and html() require Component
// ═══════════════════════════════════════════════════════════════════

describe("§3 query/html guard", () => {
  it("query() throws when no Component", () => {
    const page = createPage(makeApp());
    page.goto("test-zone");

    expect(() => page.query("item-a")).toThrow();
    page.cleanup();
  });

  it("html() throws when no Component", () => {
    const page = createPage(makeApp());
    page.goto("test-zone");

    expect(() => page.html()).toThrow();
    page.cleanup();
  });

  it("query() works with Component", () => {
    const page = createPage(makeApp(), TestComponent);
    page.goto("test-zone");

    expect(page.query("item-a")).toBe(true);
    page.cleanup();
  });
});
