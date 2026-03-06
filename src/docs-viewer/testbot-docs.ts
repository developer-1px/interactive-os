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
 *
 * Item IDs are resolved dynamically via getItems() pure functions —
 * no hardcoded fixture IDs. Scripts receive items as 3rd parameter.
 */

import type { TestScenario, TestScript } from "@os-devtool/testing";
import {
  buildDocTree,
  docsModules,
  flattenTree,
  flattenVisibleTree,
  getFavoriteFiles,
} from "./docsUtils";

// ═══════════════════════════════════════════════════════════════════
// Auto-discovery metadata — testbot-manifest.ts reads these eagerly
// ═══════════════════════════════════════════════════════════════════

/** Zone IDs that trigger this file's scripts */
export const zones = ["docs-sidebar", "docs-recent", "docs-favorites"];
/** UI group name */
export const group = "Docs Viewer";

// ═══════════════════════════════════════════════════════════════════
// Item Discovery — pure functions, no OS state dependency
// ═══════════════════════════════════════════════════════════════════

const docTree = buildDocTree(Object.keys(docsModules));
const allFiles = flattenTree(docTree);

/** Sidebar items with no folders expanded (initial view) */
function getSidebarItems(): string[] {
  const nodes = flattenVisibleTree(docTree, [], 0, { sectionLevel: 0 });
  return nodes
    .filter((n) => !(n.type === "folder" && n.level === 0))
    .map((n) => n.id);
}

/** Favorite items from localStorage (falls back to first 2 files if none pinned) */
function getFavItems(): string[] {
  const favs = getFavoriteFiles(allFiles).map((f) => f.path);
  return favs.length >= 2 ? favs : allFiles.slice(0, 2).map((f) => f.path);
}

// ═══════════════════════════════════════════════════════════════════
// §1 사이드바 트리 — 핵심 탐색
// ═══════════════════════════════════════════════════════════════════

export const sidebarNavScripts: TestScript[] = [
  {
    name: "§1a 사이드바: 클릭하면 포커스된다",
    zone: "docs-sidebar",
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await expect(page.locator(`#${items[0]}`)).toBeFocused();
    },
  },

  {
    name: "§1b 사이드바: ↓ 키로 다음 항목 이동",
    zone: "docs-sidebar",
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await expect(page.locator(`#${items[0]}`)).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(page.locator(`#${items[1]}`)).toBeFocused();
    },
  },

  {
    name: "§1c 사이드바: ↑ 키로 이전 항목 이동",
    zone: "docs-sidebar",
    async run(page, expect, items = []) {
      await page.locator(`#${items[1]}`).click();
      await expect(page.locator(`#${items[1]}`)).toBeFocused();

      await page.keyboard.press("ArrowUp");
      await expect(page.locator(`#${items[0]}`)).toBeFocused();
    },
  },

  {
    name: "§1d 사이드바: ↓ 연속으로 트리 순회",
    zone: "docs-sidebar",
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await expect(page.locator(`#${items[0]}`)).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await expect(page.locator(`#${items[2]}`)).toBeFocused();
    },
  },

  {
    name: "§1e 사이드바: Home 키로 첫 항목 이동",
    zone: "docs-sidebar",
    async run(page, expect, items = []) {
      await page.locator(`#${items[2]}`).click();
      await expect(page.locator(`#${items[2]}`)).toBeFocused();

      await page.keyboard.press("Home");
      await expect(page.locator(`#${items[0]}`)).toBeFocused();
    },
  },

  {
    name: "§1f 사이드바: End 키로 마지막 항목 이동",
    zone: "docs-sidebar",
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await expect(page.locator(`#${items[0]}`)).toBeFocused();

      await page.keyboard.press("End");
      await expect(page.locator(`#${items[items.length - 1]}`)).toBeFocused();
    },
  },

  {
    name: "§1g 사이드바: 첫 항목에서 ↑ 키는 경계 클램프",
    zone: "docs-sidebar",
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await expect(page.locator(`#${items[0]}`)).toBeFocused();

      await page.keyboard.press("ArrowUp");
      await expect(page.locator(`#${items[0]}`)).toBeFocused();
    },
  },

  {
    name: "§1h 사이드바: 마지막 항목에서 ↓ 키는 경계 클램프",
    zone: "docs-sidebar",
    async run(page, expect, items = []) {
      const lastId = items[items.length - 1];
      await page.locator(`#${lastId}`).click();
      await expect(page.locator(`#${lastId}`)).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(page.locator(`#${lastId}`)).toBeFocused();
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
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await expect(page.locator(`#${items[0]}`)).toBeFocused();
      await expect(page.locator(`#${items[0]}`)).toHaveAttribute(
        "aria-selected",
        "true",
      );
    },
  },

  {
    name: "§2b 최근 목록: ↓ 이동 시 선택도 따라간다",
    zone: "docs-recent",
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await expect(page.locator(`#${items[0]}`)).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(page.locator(`#${items[1]}`)).toBeFocused();
      await expect(page.locator(`#${items[1]}`)).toHaveAttribute(
        "aria-selected",
        "true",
      );
      // 이전 항목 선택 해제
      await expect(page.locator(`#${items[0]}`)).toHaveAttribute(
        "aria-selected",
        "false",
      );
    },
  },

  {
    name: "§2c 최근 목록: ↑ 키로 위로 이동",
    zone: "docs-recent",
    async run(page, expect, items = []) {
      await page.locator(`#${items[1]}`).click();
      await expect(page.locator(`#${items[1]}`)).toBeFocused();

      await page.keyboard.press("ArrowUp");
      await expect(page.locator(`#${items[0]}`)).toBeFocused();
    },
  },

  {
    name: "§2d 최근 목록: 첫 항목에서 ↑ 키는 경계 클램프",
    zone: "docs-recent",
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await expect(page.locator(`#${items[0]}`)).toBeFocused();

      await page.keyboard.press("ArrowUp");
      await expect(page.locator(`#${items[0]}`)).toBeFocused();
    },
  },

  {
    name: "§2e 최근 목록: 다른 항목 클릭 시 이전 선택 해제",
    zone: "docs-recent",
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await expect(page.locator(`#${items[0]}`)).toHaveAttribute(
        "aria-selected",
        "true",
      );

      await page.locator(`#${items[2]}`).click();
      await expect(page.locator(`#${items[2]}`)).toBeFocused();
      await expect(page.locator(`#${items[2]}`)).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(page.locator(`#${items[0]}`)).toHaveAttribute(
        "aria-selected",
        "false",
      );
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
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await expect(page.locator(`#${items[0]}`)).toBeFocused();
      await expect(page.locator(`#${items[0]}`)).toHaveAttribute(
        "aria-selected",
        "true",
      );
    },
  },

  {
    name: "§3b 즐겨찾기: 포커스 이동 시 선택도 따라간다",
    zone: "docs-favorites",
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await expect(page.locator(`#${items[0]}`)).toHaveAttribute(
        "aria-selected",
        "true",
      );

      await page.keyboard.press("ArrowDown");
      await expect(page.locator(`#${items[1]}`)).toBeFocused();
      await expect(page.locator(`#${items[1]}`)).toHaveAttribute(
        "aria-selected",
        "true",
      );
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// §4 Tab Navigation — Zone 간 전환 (cross-zone, 수동 테스트 유지)
//
// Cross-zone 시나리오는 auto-runner 대상이 아님.
// 단일 zone goto()로 표현 불가 — 별도 테스트 파일에서 수동 관리.
// ═══════════════════════════════════════════════════════════════════

export const tabNavigationScripts: TestScript[] = [
  {
    name: "§4a Tab: 사이드바에서 Tab → 다른 zone으로 escape",
    zone: "docs-sidebar",
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await expect(page.locator(`#${items[0]}`)).toBeFocused();

      await page.keyboard.press("Tab");

      await expect(page.locator(`#${items[0]}`)).not.toBeFocused();
    },
  },

  {
    name: "§4b Tab: 사이드바에서 Shift+Tab → 역방향 zone escape",
    zone: "docs-sidebar",
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await expect(page.locator(`#${items[0]}`)).toBeFocused();

      await page.keyboard.press("Shift+Tab");

      await expect(page.locator(`#${items[0]}`)).not.toBeFocused();
    },
  },

  {
    name: "§4c Tab: 최근 목록에서 Tab → 다른 zone escape",
    zone: "docs-recent",
    async run(page, expect, items = []) {
      await page.locator(`#${items[0]}`).click();
      await expect(page.locator(`#${items[0]}`)).toBeFocused();

      await page.keyboard.press("Tab");

      await expect(page.locator(`#${items[0]}`)).not.toBeFocused();
    },
  },

  {
    name: "§4d Tab: 사이드바 마지막→Tab→escape",
    zone: "docs-sidebar",
    async run(page, expect, items = []) {
      const lastId = items[items.length - 1];
      await page.locator(`#${lastId}`).click();
      await expect(page.locator(`#${lastId}`)).toBeFocused();

      await page.keyboard.press("Tab");

      await expect(page.locator(`#${lastId}`)).not.toBeFocused();
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// Scenarios — auto-runner reads this for vitest auto-registration
// ═══════════════════════════════════════════════════════════════════

export const scenarios: TestScenario[] = [
  {
    zone: "docs-sidebar",
    getItems: getSidebarItems,
    role: "tree",
    scripts: sidebarNavScripts,
  },
  {
    zone: "docs-recent",
    getItems: () => allFiles.slice(0, 5).map((f) => f.path),
    role: "listbox",
    scripts: recentListScripts,
  },
  {
    zone: "docs-favorites",
    getItems: getFavItems,
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
