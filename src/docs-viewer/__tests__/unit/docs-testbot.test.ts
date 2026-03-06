/**
 * DocsViewer — Headless TestBot Runner (vitest)
 *
 * testbot-docs.ts의 TestScript[]를 headless 환경에서 실행.
 * 같은 스크립트, 다른 런타임:
 *   - 여기: createHeadlessPage() + page.goto()
 *   - 브라우저: TestBot 패널의 createBrowserPage()
 *   - E2E: Playwright native page
 */

import { createHeadlessPage, expect } from "@os-devtool/testing";
import { afterEach, describe, it } from "vitest";
import {
    FAVORITE_ITEMS,
    favoritesScripts,
    RECENT_ITEMS,
    recentListScripts,
    SIDEBAR_ITEMS,
    sidebarNavScripts,
} from "../../testbot-docs";

// ═══════════════════════════════════════════════════════════════════
// §1 사이드바 트리
// ═══════════════════════════════════════════════════════════════════

describe("§1 사이드바 트리", () => {
    const page = createHeadlessPage();

    afterEach(() => {
        page.cleanup();
    });

    for (const script of sidebarNavScripts) {
        it(script.name, async () => {
            page.goto("docs-sidebar", {
                items: SIDEBAR_ITEMS,
                role: "tree",
            });
            await script.run(page, expect);
        });
    }
});

// ═══════════════════════════════════════════════════════════════════
// §2 최근 목록
// ═══════════════════════════════════════════════════════════════════

describe("§2 최근 목록", () => {
    const page = createHeadlessPage();

    afterEach(() => {
        page.cleanup();
    });

    for (const script of recentListScripts) {
        it(script.name, async () => {
            page.goto("docs-recent", {
                items: RECENT_ITEMS,
                role: "listbox",
            });
            await script.run(page, expect);
        });
    }
});

// ═══════════════════════════════════════════════════════════════════
// §3 즐겨찾기
// ═══════════════════════════════════════════════════════════════════

describe("§3 즐겨찾기", () => {
    const page = createHeadlessPage();

    afterEach(() => {
        page.cleanup();
    });

    for (const script of favoritesScripts) {
        it(script.name, async () => {
            page.goto("docs-favorites", {
                items: FAVORITE_ITEMS,
                role: "listbox",
            });
            await script.run(page, expect);
        });
    }
});
