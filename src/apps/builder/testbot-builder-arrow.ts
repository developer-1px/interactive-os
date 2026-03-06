/**
 * Builder Hierarchical Navigation — TestBot Scripts
 *
 * 빌더 캔버스의 계층별(section/group/item) 화살표 이동 + drillDown/Up 진단.
 *
 * 계층 구조 (Green Eye 프리셋):
 *   section: ge-hero, ge-notice, ge-features, ge-usecase, ge-detail, ...
 *   group:   ge-card-1, ge-card-2, ge-card-3 (ge-features의 자식)
 *   item:    ge-card-1-card-title, ge-card-1-card-desc (ge-card-1의 자식)
 *
 * 네비게이션:
 *   Arrow: 같은 레벨 형제 이동 (itemFilter가 data-level로 필터)
 *   Enter: 아래 레벨로 drill down (section→group→item→edit)
 *   \:     위 레벨로 drill up (item→group→section)
 *
 * Playwright Strict Subset Rule (K2): document.querySelector 금지.
 */

import type { TestScript } from "@os-devtool/testing";

// Auto-discovery metadata — testbot-manifest.ts reads these eagerly
export const zones = ["canvas"];
export const group = "Builder";

export const builderArrowNavScripts: TestScript[] = [
  // ─── Level 1: Section ───────────────────────────────────
  {
    name: "§1 Section: 화살표 ↓ 이동 (ge-hero → ge-notice)",
    async run(page, expect) {
      await page.locator("ge-hero").click();
      await expect(page.locator("ge-hero")).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(page.locator("ge-hero")).not.toBeFocused();
      await expect(page.locator("ge-notice")).toBeFocused();
    },
  },
  {
    name: "§1 Section: 화살표 ↑ 역이동 (ge-notice → ge-hero)",
    async run(page, expect) {
      await page.locator("ge-notice").click();
      await expect(page.locator("ge-notice")).toBeFocused();

      await page.keyboard.press("ArrowUp");
      await expect(page.locator("ge-hero")).toBeFocused();
    },
  },

  // ─── Drill Down: Section → Group ────────────────────────
  {
    name: "§2 DrillDown: Enter로 section→group (ge-features → ge-card-1)",
    async run(page, expect) {
      await page.locator("ge-features").click();
      await expect(page.locator("ge-features")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1")).toBeFocused();
    },
  },

  // ─── Level 2: Group ─────────────────────────────────────
  {
    name: "§3 Group: 화살표 ↓ 이동 (ge-card-1 → ge-card-2)",
    async run(page, expect) {
      await page.locator("ge-features").click();
      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1")).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(page.locator("ge-card-1")).not.toBeFocused();
      await expect(page.locator("ge-card-2")).toBeFocused();
    },
  },

  // ─── Drill Up: Group → Section ──────────────────────────
  {
    name: "§4 DrillUp: \\\\ 로 group→section (ge-card-1 → ge-features)",
    async run(page, expect) {
      await page.locator("ge-features").click();
      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1")).toBeFocused();
      await page.keyboard.press("\\");
      await expect(page.locator("ge-features")).toBeFocused();
    },
  },

  // ─── Drill Down: Group → Item ───────────────────────────
  {
    name: "§5 DrillDown: Enter로 group→item (ge-card-1 → 첫 번째 필드)",
    async run(page, expect) {
      await page.locator("ge-features").click();
      await expect(page.locator("ge-features")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1")).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1-card-title")).toBeFocused();
    },
  },

  // ─── Level 3: Item ──────────────────────────────────────
  {
    name: "§6 Item: 화살표 ↓ 이동 (ge-card-1-card-title → desc)",
    async run(page, expect) {
      await page.locator("ge-features").click();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1-card-title")).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(page.locator("ge-card-1-card-title")).not.toBeFocused();
      await expect(page.locator("ge-card-1-card-desc")).toBeFocused();
    },
  },

  // ─── Full Round Trip ────────────────────────────────────
  {
    name: "§7 전체 여정: section→group→item→group→section",
    async run(page, expect) {
      await page.locator("ge-features").click();
      await expect(page.locator("ge-features")).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1")).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1")).not.toBeFocused();

      await page.keyboard.press("\\");
      await expect(page.locator("ge-card-1")).toBeFocused();

      await page.keyboard.press("\\");
      await expect(page.locator("ge-features")).toBeFocused();
    },
  },
];
