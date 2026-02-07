/**
 * SpatialTest — Builder Spatial Navigation Test
 *
 * Uses TestBot for E2E-style visual testing with a virtual cursor.
 * All interactions go through real DOM events (keyboard, mouse),
 * eliminating internal API coupling and infinite loop risks.
 */

import type { TestBot } from "@os/testBot";

// ═══════════════════════════════════════════════════════════════════
// Test Definitions
// ═══════════════════════════════════════════════════════════════════

function defineRoutes(bot: TestBot) {
    // --- NCP Hero Block: Internal vertical flow ---
    bot.describe("Hero 수직 흐름", async (t) => {
        await t.click("#ncp-hero-title");
        await t.press("ArrowDown");
        await t.expect("#ncp-hero-sub").focused();
        await t.press("ArrowDown");
        await t.expect("#ncp-hero-cta").focused();
    });

    // --- NCP Hero Nav Bar: Horizontal flow ---
    bot.describe("Hero 상단 Nav 수평", async (t) => {
        await t.click("#ncp-hero-brand");
        await t.press("ArrowRight");
        await t.expect("#ncp-hero-login").focused();
        await t.press("ArrowRight");
        await t.expect("#ncp-hero-signup").focused();
        await t.press("ArrowRight");
        await t.expect("#ncp-hero-languages").focused();
    });

    // --- Cross-zone: Hero → News ---
    bot.describe("Hero → News 크로스존", async (t) => {
        await t.click("#ncp-hero-cta");
        await t.press("ArrowDown");
        await t.expect("#ncp-news-title").focused();
    });

    // --- NCP News Block: Title row ---
    bot.describe("News 제목 행", async (t) => {
        await t.click("#ncp-news-title");
        await t.press("ArrowRight");
        await t.expect("#ncp-news-prev").focused();
        await t.press("ArrowRight");
        await t.expect("#ncp-news-next").focused();
    });

    // --- NCP News Block: Card flow ---
    bot.describe("News 카드 내부", async (t) => {
        await t.click("#news-1-tag");
        await t.press("ArrowDown");
        await t.expect("#news-1-title").focused();
        await t.press("ArrowDown");
        await t.expect("#news-1-link").focused();
    });

    // --- NCP News Block: Card-to-card horizontal ---
    bot.describe("News 카드 수평 이동", async (t) => {
        await t.click("#news-1-tag");
        await t.press("ArrowRight");
        await t.expect("#news-2-tag").focused();
        await t.press("ArrowRight");
        await t.expect("#news-3-tag").focused();
    });

    // --- Cross-zone: News → Services ---
    bot.describe("News → Services 크로스존", async (t) => {
        await t.click("#news-1-link");
        await t.press("ArrowDown");
        await t.expect("#tab-0").focused();
    });

    // --- NCP Services: Tab horizontal ---
    bot.describe("Services 탭 수평 이동", async (t) => {
        await t.click("#tab-0");
        await t.press("ArrowRight");
        await t.expect("#tab-1").focused();
        await t.press("ArrowRight");
        await t.expect("#tab-2").focused();
        await t.press("ArrowLeft");
        await t.expect("#tab-1").focused();
    });

    // --- NCP Services: Tab → Content below ---
    bot.describe("Services 탭 → 콘텐츠", async (t) => {
        await t.click("#tab-0");
        await t.press("ArrowDown");
        await t.expect("#ncp-featured-recommend").focused();
    });

    // --- NCP Services: Service list spatial ---
    bot.describe("Services 서비스 목록", async (t) => {
        await t.click("#service-icon-0");
        await t.press("ArrowRight");
        await t.expect("#service-title-0").focused();
        await t.press("ArrowRight");
        await t.expect("#service-badge-0").focused();
        await t.press("ArrowDown");
        await t.expect("#service-title-1").focused();
    });

    // --- NCP Services: Featured card internal ---
    bot.describe("Featured 카드 내부", async (t) => {
        await t.click("#ncp-featured-recommend");
        await t.press("ArrowDown");
        await t.expect("#ncp-featured-title").focused();
    });

    // --- Full page vertical sweep ---
    bot.describe("전체 페이지 수직 스윕", async (t) => {
        await t.click("#ncp-hero-title");
        await t.press("ArrowDown");
        await t.expect("#ncp-hero-sub").focused();
        await t.press("ArrowDown");
        await t.expect("#ncp-hero-cta").focused();
        await t.press("ArrowDown");
        await t.expect("#ncp-news-title").focused();
        await t.press("ArrowDown");
        await t.expect("#news-1-tag").focused();
        await t.press("ArrowDown");
        await t.expect("#news-1-title").focused();
        await t.press("ArrowDown");
        await t.expect("#news-1-link").focused();
        await t.press("ArrowDown");
        await t.expect("#tab-0").focused();
        await t.press("ArrowDown");
        await t.expect("#ncp-featured-recommend").focused();
    });
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

import { useTestBotRoutes } from "@os/testBot/useTestBotRoutes";

export function useSpatialTestRoutes() {
    useTestBotRoutes("builder-spatial", defineRoutes);
}
