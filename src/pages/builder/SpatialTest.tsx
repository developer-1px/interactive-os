/**
 * SpatialTest — Builder Spatial + Seamless Navigation Test
 *
 * Tests the TV-style spatial navigation and cross-zone seamless
 * navigation within the Builder page.
 *
 * Zone/Item Map (as of Phase 2 redesign):
 *
 * Hero Zone (ncp-hero, role=builderBlock, orientation=both, seamless)
 *   ├─ Field: ncp-hero-title
 *   ├─ Field: ncp-hero-sub
 *   ├─ Item:  ncp-hero-cta
 *   └─ Nav Zone (ncp-hero-nav, role=builderBlock)
 *       ├─ Field: ncp-hero-brand
 *       ├─ Item:  nav-login
 *       └─ Item:  nav-signup
 *
 * News Zone (ncp-news, role=builderBlock, orientation=both, seamless)
 *   ├─ Field: ncp-news-title
 *   ├─ Item:  ncp-news-all
 *   ├─ SubZone: card-news-1 (role=builderBlock)
 *   │    └─ Field: news-1-title
 *   ├─ SubZone: card-news-2 (role=builderBlock)
 *   │    └─ Field: news-2-title
 *   └─ SubZone: card-news-3 (role=builderBlock)
 *        └─ Field: news-3-title
 *
 * Services Zone (ncp-services, role=builderBlock, orientation=both, seamless)
 *   ├─ Field: ncp-service-title
 *   ├─ SubZone: ncp-service-tabs (role=builderBlock, horizontal)
 *   │    └─ Items: tab-0 .. tab-6
 *   └─ SubZone: ncp-service-list (role=builderBlock)
 *        └─ Fields: service-title-0..5, service-desc-0..5
 */

import type { TestBot } from "@os/testBot";

// ═══════════════════════════════════════════════════════════════════
// Test Definitions
// ═══════════════════════════════════════════════════════════════════

function defineRoutes(bot: TestBot) {
  // ─────────────────────────────────────────────────────────────
  // 1. Hero: Internal vertical flow (Title → Sub → CTA)
  // Verifies: Linear down within a single zone
  // ─────────────────────────────────────────────────────────────
  bot.describe("Hero 수직 흐름", async (t) => {
    await t.click("#ncp-hero-title");
    await t.expect("#ncp-hero-title").focused();

    await t.press("ArrowDown");
    await t.expect("#ncp-hero-sub").focused();

    await t.press("ArrowDown");
    await t.expect("#ncp-hero-cta").focused();

    // Verify reverse
    await t.press("ArrowUp");
    await t.expect("#ncp-hero-sub").focused();

    await t.press("ArrowUp");
    await t.expect("#ncp-hero-title").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Hero Nav: Horizontal flow (Brand → Login → Signup)
  // Verifies: Spatial navigation on horizontal items within hero-nav
  // ─────────────────────────────────────────────────────────────
  bot.describe("Hero Nav 수평", async (t) => {
    await t.click("#ncp-hero-brand");
    await t.expect("#ncp-hero-brand").focused();

    await t.press("ArrowRight");
    await t.expect("#nav-login").focused();

    await t.press("ArrowRight");
    await t.expect("#nav-signup").focused();

    // Reverse
    await t.press("ArrowLeft");
    await t.expect("#nav-login").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Cross-zone seamless: Hero → News (Down)
  // Verifies: Seamless triggers when hitting zone boundary
  // ─────────────────────────────────────────────────────────────
  bot.describe("Hero → News 크로스존", async (t) => {
    await t.click("#ncp-hero-cta");
    await t.expect("#ncp-hero-cta").focused();

    // Down from CTA (last item in hero) should seamless-jump to News
    await t.press("ArrowDown");
    await t.expect("#ncp-news-title").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 4. News: Title → "View All" button horizontal
  // Verifies: Spatial horizontal within news zone header area
  // ─────────────────────────────────────────────────────────────
  bot.describe("News 제목 행 수평", async (t) => {
    await t.click("#ncp-news-title");
    await t.expect("#ncp-news-title").focused();

    // Right → "전체 뉴스 보기" button (ncp-news-all)
    await t.press("ArrowRight");
    await t.expect("#ncp-news-all").focused();

    // Left → back to title
    await t.press("ArrowLeft");
    await t.expect("#ncp-news-title").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Services: Tab horizontal navigation
  // Verifies: Horizontal tab switching within ncp-service-tabs zone
  // ─────────────────────────────────────────────────────────────
  bot.describe("Services 탭 수평", async (t) => {
    await t.click("#tab-0");
    await t.expect("#tab-0").focused();

    await t.press("ArrowRight");
    await t.expect("#tab-1").focused();

    await t.press("ArrowRight");
    await t.expect("#tab-2").focused();

    // Left
    await t.press("ArrowLeft");
    await t.expect("#tab-1").focused();

    await t.press("ArrowLeft");
    await t.expect("#tab-0").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Services: Tab → Service cards (Down)
  // Verifies: Cross-zone seamless from tabs to service-list
  // ─────────────────────────────────────────────────────────────
  bot.describe("Services 탭 → 서비스 카드", async (t) => {
    await t.click("#tab-0");
    await t.expect("#tab-0").focused();

    // Down from tabs → should enter service-list zone
    await t.press("ArrowDown");
    await t.expect("#service-title-0").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Services: Service card internal (Title → Desc down)
  // Verifies: Spatial vertical within a service card
  // ─────────────────────────────────────────────────────────────
  bot.describe("Services 서비스 카드 내부", async (t) => {
    await t.click("#service-title-0");
    await t.expect("#service-title-0").focused();

    // Down → desc
    await t.press("ArrowDown");
    await t.expect("#service-desc-0").focused();

    // Up → back to title
    await t.press("ArrowUp");
    await t.expect("#service-title-0").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Services: Service card horizontal (Title-0 → Title-1 right)
  // Verifies: Spatial horizontal between adjacent service cards
  // ─────────────────────────────────────────────────────────────
  bot.describe("Services 서비스 카드 수평", async (t) => {
    await t.click("#service-title-0");
    await t.expect("#service-title-0").focused();

    // Right → next card's title (spatial alignment)
    await t.press("ArrowRight");
    await t.expect("#service-title-1").focused();

    await t.press("ArrowRight");
    await t.expect("#service-title-2").focused();

    // Left → back
    await t.press("ArrowLeft");
    await t.expect("#service-title-1").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Cross-zone seamless: News → Services (Down)
  // Verifies: Seamless from news zone → services zone
  // ─────────────────────────────────────────────────────────────
  bot.describe("News → Services 크로스존", async (t) => {
    await t.click("#ncp-news-all");
    await t.expect("#ncp-news-all").focused();

    // Down from news "view all" → should enter services zone
    await t.press("ArrowDown");
    await t.expect("#ncp-service-title").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 10. Full Page Vertical Sweep
  // Verifies: Complete top-to-bottom navigation through all zones
  // ─────────────────────────────────────────────────────────────
  bot.describe("전체 페이지 수직 스윕", async (t) => {
    // Hero zone
    await t.click("#ncp-hero-title");
    await t.expect("#ncp-hero-title").focused();

    await t.press("ArrowDown");
    await t.expect("#ncp-hero-sub").focused();

    await t.press("ArrowDown");
    await t.expect("#ncp-hero-cta").focused();

    // Seamless: Hero → News
    await t.press("ArrowDown");
    await t.expect("#ncp-news-title").focused();

    // Continue down through news
    await t.press("ArrowDown");
    await t.expect("#ncp-news-all").focused();

    // Seamless: News → Services
    await t.press("ArrowDown");
    await t.expect("#ncp-service-title").focused();
  });
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

import { useTestBotRoutes } from "@os/testBot";

export function useSpatialTestRoutes() {
  useTestBotRoutes("builder-spatial", defineRoutes);
}
