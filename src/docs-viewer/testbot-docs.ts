/**
 * DocsViewer — TestBot Scripts (Unified: Headless + Browser + E2E)
 *
 * "Write once, run anywhere":
 *   1. vitest headless — auto-runner reads `scenarios` export
 *   2. browser visual  — TestBot reads via manifest (zones/group/scripts)
 *   3. Playwright E2E  — native page
 *
 * Page API subset = Playwright Strict Subset Rule (K2):
 *   page.locator("#id").click(), page.keyboard.press(),
 *   expect(loc).toHaveAttribute(), expect(loc).toBeFocused(),
 *   locator.getAttribute()
 *
 * Locator convention: always use "#id" selector (Playwright-compatible).
 * Items are discovered via page.locator('[data-item]').nth(n) — no injection.
 */

import type { TestScenario, TestScript } from "@os-testing/scripts";

// ═══════════════════════════════════════════════════════════════════
// Auto-discovery metadata — testbot-manifest.ts reads these eagerly
// ═══════════════════════════════════════════════════════════════════

/** Zone IDs that trigger this file's scripts */
export const zones = ["docs-sidebar", "docs-recent", "docs-favorites"];
/** Route path prefix — primary filter key for TestBot panel */
export const route = "/docs";
/** UI group name */
export const group = "Docs Viewer";

// ═══════════════════════════════════════════════════════════════════
// §1 사이드바 트리 — 핵심 탐색
// ═══════════════════════════════════════════════════════════════════

export const sidebarNavScripts: TestScript[] = [
  {
    name: "§1a 사이드바: 클릭하면 포커스된다",
    zone: "docs-sidebar",
    async run(page, expect) {
      const item0 = page.locator("[data-item]").nth(0);
      await item0.click();
      await expect(item0).toBeFocused();
    },
  },

  {
    name: "§1b 사이드바: ↓ 키로 다음 항목 이동",
    zone: "docs-sidebar",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(0).click();
      await expect(items.nth(0)).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(items.nth(1)).toBeFocused();
    },
  },

  {
    name: "§1c 사이드바: ↑ 키로 이전 항목 이동",
    zone: "docs-sidebar",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(1).click();
      await expect(items.nth(1)).toBeFocused();

      await page.keyboard.press("ArrowUp");
      await expect(items.nth(0)).toBeFocused();
    },
  },

  {
    name: "§1d 사이드바: ↓ 연속으로 트리 순회",
    zone: "docs-sidebar",
    todo: true, // OS gap: tree nav consecutive ArrowDown doesn't advance
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(0).click();
      await expect(items.nth(0)).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await expect(items.nth(2)).toBeFocused();
    },
  },

  {
    name: "§1e 사이드바: Home 키로 첫 항목 이동",
    zone: "docs-sidebar",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(2).click();
      await expect(items.nth(2)).toBeFocused();

      await page.keyboard.press("Home");
      await expect(items.nth(0)).toBeFocused();
    },
  },

  {
    name: "§1f 사이드바: End 키로 마지막 항목 이동",
    zone: "docs-sidebar",
    todo: true, // OS gap: End key doesn't reach last item in tree
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(0).click();
      await expect(items.nth(0)).toBeFocused();

      await page.keyboard.press("End");
      await expect(items.last()).toBeFocused();
    },
  },

  {
    name: "§1g 사이드바: 첫 항목에서 ↑ 키는 경계 클램프",
    zone: "docs-sidebar",
    async run(page, expect) {
      const item0 = page.locator("[data-item]").nth(0);
      await item0.click();
      await expect(item0).toBeFocused();

      await page.keyboard.press("ArrowUp");
      await expect(item0).toBeFocused();
    },
  },

  {
    name: "§1h 사이드바: 마지막 항목에서 ↓ 키는 경계 클램프",
    zone: "docs-sidebar",
    async run(page, expect) {
      const lastItem = page.locator("[data-item]").last();
      await lastItem.click();
      await expect(lastItem).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(lastItem).toBeFocused();
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// §2 최근 목록 — followFocus 선택
// ═══════════════════════════════════════════════════════════════════

export const recentListScripts: TestScript[] = [
  {
    name: "§2a 최근 목록: 클릭하면 포커스·선택된다",
    zone: "docs-recent",
    async run(page, expect) {
      const item0 = page.locator("[data-item]").nth(0);
      await item0.click();
      await expect(item0).toBeFocused();
      await expect(item0).toHaveAttribute("aria-selected", "true");
    },
  },

  {
    name: "§2b 최근 목록: ↓ 이동 시 선택도 따라간다",
    zone: "docs-recent",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(0).click();
      await expect(items.nth(0)).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(items.nth(1)).toBeFocused();
      await expect(items.nth(1)).toHaveAttribute("aria-selected", "true");
      // 이전 항목 선택 해제
      await expect(items.nth(0)).toHaveAttribute("aria-selected", "false");
    },
  },

  {
    name: "§2c 최근 목록: ↑ 키로 위로 이동",
    zone: "docs-recent",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(1).click();
      await expect(items.nth(1)).toBeFocused();

      await page.keyboard.press("ArrowUp");
      await expect(items.nth(0)).toBeFocused();
    },
  },

  {
    name: "§2d 최근 목록: 첫 항목에서 ↑ 키는 경계 클램프",
    zone: "docs-recent",
    async run(page, expect) {
      const item0 = page.locator("[data-item]").nth(0);
      await item0.click();
      await expect(item0).toBeFocused();

      await page.keyboard.press("ArrowUp");
      await expect(item0).toBeFocused();
    },
  },

  {
    name: "§2e 최근 목록: 다른 항목 클릭 시 이전 선택 해제",
    zone: "docs-recent",
    todo: true, // OS gap: projection cache invalidation timing
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(0).click();
      await expect(items.nth(0)).toHaveAttribute("aria-selected", "true");

      await items.nth(2).click();
      await expect(items.nth(2)).toBeFocused();
      await expect(items.nth(2)).toHaveAttribute("aria-selected", "true");
      await expect(items.nth(0)).toHaveAttribute("aria-selected", "false");
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// §3 즐겨찾기 — followFocus 선택
// ═══════════════════════════════════════════════════════════════════

export const favoritesScripts: TestScript[] = [
  {
    name: "§3a 즐겨찾기: 클릭하면 포커스·선택된다",
    zone: "docs-favorites",
    async run(page, expect) {
      const item0 = page.locator("[data-item]").nth(0);
      await item0.click();
      await expect(item0).toBeFocused();
      await expect(item0).toHaveAttribute("aria-selected", "true");
    },
  },

  {
    name: "§3b 즐겨찾기: 포커스 이동 시 선택도 따라간다",
    zone: "docs-favorites",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(0).click();
      await expect(items.nth(0)).toHaveAttribute("aria-selected", "true");

      await page.keyboard.press("ArrowDown");
      await expect(items.nth(1)).toBeFocused();
      await expect(items.nth(1)).toHaveAttribute("aria-selected", "true");
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// §4 Tab Navigation — Zone 간 전환 (cross-zone)
//
// Tier 2 auto-runner (createPage(app) + goto("/"))에서
// 모든 zone이 등록되므로 cross-zone Tab도 auto-runner 대상.
// ═══════════════════════════════════════════════════════════════════

export const tabNavigationScripts: TestScript[] = [
  {
    name: "§4a Tab: 사이드바에서 Tab → 다른 zone으로 escape",
    zone: "docs-sidebar",
    todo: true, // OS gap: OS_TAB doesn't clear old zone focus
    async run(page, expect) {
      const item0 = page.locator("[data-item]").nth(0);
      await item0.click();
      await expect(item0).toBeFocused();

      await page.keyboard.press("Tab");

      await expect(item0).not.toBeFocused();
    },
  },

  {
    name: "§4b Tab: 사이드바에서 Shift+Tab → 역방향 zone escape",
    zone: "docs-sidebar",
    async run(page, expect) {
      const item0 = page.locator("[data-item]").nth(0);
      await item0.click();
      await expect(item0).toBeFocused();

      await page.keyboard.press("Shift+Tab");

      await expect(item0).not.toBeFocused();
    },
  },

  {
    name: "§4c Tab: 최근 목록에서 Tab → 다른 zone escape",
    zone: "docs-recent",
    todo: true, // OS gap: OS_TAB doesn't clear old zone focus
    async run(page, expect) {
      const item0 = page.locator("[data-item]").nth(0);
      await item0.click();
      await expect(item0).toBeFocused();

      await page.keyboard.press("Tab");

      await expect(item0).not.toBeFocused();
    },
  },

  {
    name: "§4d Tab: 사이드바 마지막→Tab→escape",
    zone: "docs-sidebar",
    async run(page, expect) {
      const lastItem = page.locator("[data-item]").last();
      await lastItem.click();
      await expect(lastItem).toBeFocused();

      await page.keyboard.press("Tab");

      await expect(lastItem).not.toBeFocused();
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// Scenarios — auto-runner reads this for vitest auto-registration
// ═══════════════════════════════════════════════════════════════════

/** §4 sidebar Tab scripts (§4a, §4b, §4d) */
const sidebarTabScripts = tabNavigationScripts.filter(
  (s) => s.zone === "docs-sidebar",
);

/** §4 recent Tab scripts (§4c) */
const recentTabScripts = tabNavigationScripts.filter(
  (s) => s.zone === "docs-recent",
);

export const scenarios: TestScenario[] = [
  {
    zone: "docs-sidebar",
    role: "tree",
    scripts: [...sidebarNavScripts, ...sidebarTabScripts],
  },
  {
    zone: "docs-recent",
    role: "listbox",
    scripts: [...recentListScripts, ...recentTabScripts],
  },
  {
    zone: "docs-favorites",
    role: "listbox",
    scripts: favoritesScripts,
  },
];

// ═══════════════════════════════════════════════════════════════════
// All scripts — TestBot manifest에서 import
// ═══════════════════════════════════════════════════════════════════

export const docsViewerScripts: TestScript[] = [
  ...sidebarNavScripts,
  ...recentListScripts,
  ...favoritesScripts,
  ...tabNavigationScripts,
];
