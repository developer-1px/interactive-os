/**
 * DocsViewer — TestBot Scripts (Unified: Headless + Browser + E2E)
 *
 * "Write once, run anywhere" 패턴:
 *   1. vitest headless — createHeadlessPage() + page.goto()
 *   2. browser visual  — createBrowserPage() (TestBot 패널)
 *   3. Playwright E2E  — native page
 *
 * Page API subset만 사용 — Playwright Strict Subset Rule (K2):
 *   page.locator(id).click(), page.keyboard.press(),
 *   expect(loc).toHaveAttribute(), expect(loc).toBeFocused(),
 *   locator.getAttribute()
 */

import type { TestScript } from "@os-devtool/testing";

// ═══════════════════════════════════════════════════════════════════
// Auto-discovery metadata — testbot-manifest.ts reads these eagerly
// ═══════════════════════════════════════════════════════════════════

/** Zone IDs that trigger this file's scripts */
export const zones = ["docs-sidebar", "docs-recent", "docs-favorites"];
/** UI group name */
export const group = "Docs Viewer";

// ═══════════════════════════════════════════════════════════════════
// Test Fixtures — headless에서도 사용할 고정 아이템 ID
// ═══════════════════════════════════════════════════════════════════

export const SIDEBAR_ITEMS = [
    "sb-intro",
    "sb-getting-started",
    "sb-setup",
    "sb-api-overview",
    "sb-api-endpoints",
];

export const RECENT_ITEMS = [
    "rc-changelog",
    "rc-roadmap",
    "rc-release-notes",
];

export const FAVORITE_ITEMS = ["fav-pinned-a", "fav-pinned-b"];

export const NAVBAR_ITEMS = [
    "docs-btn-back",
    "docs-btn-forward",
    "docs-toggle-pin",
    "docs-btn-search",
];

export const READER_ITEMS = [
    "reader-article-1",
    "reader-article-2",
];


// ═══════════════════════════════════════════════════════════════════
// §1 사이드바 트리 — 핵심 탐색
// ═══════════════════════════════════════════════════════════════════

export const sidebarNavScripts: TestScript[] = [
    {
        name: "§1a 사이드바: 클릭하면 포커스된다",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(SIDEBAR_ITEMS[0]!).click();
            await expect(page.locator(SIDEBAR_ITEMS[0]!)).toBeFocused();
        },
    },

    {
        name: "§1b 사이드바: ↓ 키로 다음 항목 이동",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(SIDEBAR_ITEMS[0]!).click();
            await expect(page.locator(SIDEBAR_ITEMS[0]!)).toBeFocused();

            await page.keyboard.press("ArrowDown");
            await expect(page.locator(SIDEBAR_ITEMS[1]!)).toBeFocused();
        },
    },

    {
        name: "§1c 사이드바: ↑ 키로 이전 항목 이동",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(SIDEBAR_ITEMS[1]!).click();
            await expect(page.locator(SIDEBAR_ITEMS[1]!)).toBeFocused();

            await page.keyboard.press("ArrowUp");
            await expect(page.locator(SIDEBAR_ITEMS[0]!)).toBeFocused();
        },
    },

    {
        name: "§1d 사이드바: ↓ 연속으로 트리 순회",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(SIDEBAR_ITEMS[0]!).click();
            await expect(page.locator(SIDEBAR_ITEMS[0]!)).toBeFocused();

            await page.keyboard.press("ArrowDown");
            await page.keyboard.press("ArrowDown");
            await expect(page.locator(SIDEBAR_ITEMS[2]!)).toBeFocused();
        },
    },

    {
        name: "§1e 사이드바: Home 키로 첫 항목 이동",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(SIDEBAR_ITEMS[2]!).click();
            await expect(page.locator(SIDEBAR_ITEMS[2]!)).toBeFocused();

            await page.keyboard.press("Home");
            await expect(page.locator(SIDEBAR_ITEMS[0]!)).toBeFocused();
        },
    },

    {
        name: "§1f 사이드바: End 키로 마지막 항목 이동",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(SIDEBAR_ITEMS[0]!).click();
            await expect(page.locator(SIDEBAR_ITEMS[0]!)).toBeFocused();

            await page.keyboard.press("End");
            await expect(
                page.locator(SIDEBAR_ITEMS[SIDEBAR_ITEMS.length - 1]!),
            ).toBeFocused();
        },
    },

    {
        name: "§1g 사이드바: 첫 항목에서 ↑ 키는 경계 클램프",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(SIDEBAR_ITEMS[0]!).click();
            await expect(page.locator(SIDEBAR_ITEMS[0]!)).toBeFocused();

            await page.keyboard.press("ArrowUp");
            await expect(page.locator(SIDEBAR_ITEMS[0]!)).toBeFocused();
        },
    },

    {
        name: "§1h 사이드바: 마지막 항목에서 ↓ 키는 경계 클램프",
        group: "Docs Viewer",
        async run(page, expect) {
            const lastId = SIDEBAR_ITEMS[SIDEBAR_ITEMS.length - 1]!;
            await page.locator(lastId).click();
            await expect(page.locator(lastId)).toBeFocused();

            await page.keyboard.press("ArrowDown");
            await expect(page.locator(lastId)).toBeFocused();
        },
    },
];

// ═══════════════════════════════════════════════════════════════════
// §2 최근 목록 — followFocus 선택
// ═══════════════════════════════════════════════════════════════════

export const recentListScripts: TestScript[] = [
    {
        name: "§2a 최근 목록: 클릭하면 포커스·선택된다",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(RECENT_ITEMS[0]!).click();
            await expect(page.locator(RECENT_ITEMS[0]!)).toBeFocused();
            await expect(page.locator(RECENT_ITEMS[0]!)).toHaveAttribute(
                "aria-selected",
                "true",
            );
        },
    },

    {
        name: "§2b 최근 목록: ↓ 이동 시 선택도 따라간다",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(RECENT_ITEMS[0]!).click();
            await expect(page.locator(RECENT_ITEMS[0]!)).toBeFocused();

            await page.keyboard.press("ArrowDown");
            await expect(page.locator(RECENT_ITEMS[1]!)).toBeFocused();
            await expect(page.locator(RECENT_ITEMS[1]!)).toHaveAttribute(
                "aria-selected",
                "true",
            );
            // 이전 항목 선택 해제
            await expect(page.locator(RECENT_ITEMS[0]!)).toHaveAttribute(
                "aria-selected",
                "false",
            );
        },
    },

    {
        name: "§2c 최근 목록: ↑ 키로 위로 이동",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(RECENT_ITEMS[1]!).click();
            await expect(page.locator(RECENT_ITEMS[1]!)).toBeFocused();

            await page.keyboard.press("ArrowUp");
            await expect(page.locator(RECENT_ITEMS[0]!)).toBeFocused();
        },
    },

    {
        name: "§2d 최근 목록: 첫 항목에서 ↑ 키는 경계 클램프",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(RECENT_ITEMS[0]!).click();
            await expect(page.locator(RECENT_ITEMS[0]!)).toBeFocused();

            await page.keyboard.press("ArrowUp");
            await expect(page.locator(RECENT_ITEMS[0]!)).toBeFocused();
        },
    },

    {
        name: "§2e 최근 목록: 다른 항목 클릭 시 이전 선택 해제",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(RECENT_ITEMS[0]!).click();
            await expect(page.locator(RECENT_ITEMS[0]!)).toHaveAttribute(
                "aria-selected",
                "true",
            );

            await page.locator(RECENT_ITEMS[2]!).click();
            await expect(page.locator(RECENT_ITEMS[2]!)).toBeFocused();
            await expect(page.locator(RECENT_ITEMS[2]!)).toHaveAttribute(
                "aria-selected",
                "true",
            );
            await expect(page.locator(RECENT_ITEMS[0]!)).toHaveAttribute(
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
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(FAVORITE_ITEMS[0]!).click();
            await expect(page.locator(FAVORITE_ITEMS[0]!)).toBeFocused();
            await expect(page.locator(FAVORITE_ITEMS[0]!)).toHaveAttribute(
                "aria-selected",
                "true",
            );
        },
    },

    {
        name: "§3b 즐겨찾기: 포커스 이동 시 선택도 따라간다",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(FAVORITE_ITEMS[0]!).click();
            await expect(page.locator(FAVORITE_ITEMS[0]!)).toHaveAttribute(
                "aria-selected",
                "true",
            );

            await page.keyboard.press("ArrowDown");
            await expect(page.locator(FAVORITE_ITEMS[1]!)).toBeFocused();
            await expect(page.locator(FAVORITE_ITEMS[1]!)).toHaveAttribute(
                "aria-selected",
                "true",
            );
        },
    },
];

// ═══════════════════════════════════════════════════════════════════
// §4 Tab Navigation — Zone 간 전환
//
// Issue: docs-reader zone이 active일 때 items=0이면
//        resolveTab이 null 반환 → Tab이 먹통
// ═══════════════════════════════════════════════════════════════════

export const tabNavigationScripts: TestScript[] = [
    {
        name: "§4a Tab: 사이드바에서 Tab → 다른 zone으로 escape",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(SIDEBAR_ITEMS[0]!).click();
            await expect(page.locator(SIDEBAR_ITEMS[0]!)).toBeFocused();

            // Tab → escape behavior → 다음 zone으로 이동해야 함
            await page.keyboard.press("Tab");

            // 사이드바 항목이 더 이상 focused가 아니어야 함 (zone이 바뀜)
            await expect(page.locator(SIDEBAR_ITEMS[0]!)).not.toBeFocused();
        },
    },

    {
        name: "§4b Tab: 사이드바에서 Shift+Tab → 역방향 zone escape",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(SIDEBAR_ITEMS[0]!).click();
            await expect(page.locator(SIDEBAR_ITEMS[0]!)).toBeFocused();

            await page.keyboard.press("Shift+Tab");

            await expect(page.locator(SIDEBAR_ITEMS[0]!)).not.toBeFocused();
        },
    },

    {
        name: "§4c Tab: 최근 목록에서 Tab → 다른 zone escape",
        group: "Docs Viewer",
        async run(page, expect) {
            await page.locator(RECENT_ITEMS[0]!).click();
            await expect(page.locator(RECENT_ITEMS[0]!)).toBeFocused();

            await page.keyboard.press("Tab");

            await expect(page.locator(RECENT_ITEMS[0]!)).not.toBeFocused();
        },
    },

    {
        name: "§4d Tab: 사이드바 마지막→Tab→escape",
        group: "Docs Viewer",
        async run(page, expect) {
            const lastId = SIDEBAR_ITEMS[SIDEBAR_ITEMS.length - 1]!;
            await page.locator(lastId).click();
            await expect(page.locator(lastId)).toBeFocused();

            await page.keyboard.press("Tab");

            await expect(page.locator(lastId)).not.toBeFocused();
        },
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
