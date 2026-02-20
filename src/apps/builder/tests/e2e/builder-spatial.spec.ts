import { expect, test } from "@playwright/test";

test.describe("Builder Spatial Navigation", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => console.log(`[Browser] ${msg.text()}`));
    await page.goto("/builder");
  });

  test("Hero 수직 흐름", async ({ page }) => {
    await page.locator("#ncp-hero-title").click();
    await expect(page.locator("#ncp-hero-title")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-hero-sub")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-hero-cta")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#ncp-hero-sub")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#ncp-hero-title")).toBeFocused();
  });

  test("Hero Nav 수평", async ({ page }) => {
    await page.locator("#ncp-hero-brand").click();
    await expect(page.locator("#ncp-hero-brand")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#ncp-hero-nav-login")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#ncp-hero-nav-signup")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#ncp-hero-nav-login")).toBeFocused();
  });

  test("Hero → News 크로스존", async ({ page }) => {
    await page.locator("#ncp-hero-cta").click();
    await expect(page.locator("#ncp-hero-cta")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-news-title")).toBeFocused();
  });

  test("News 제목 행 수평", async ({ page }) => {
    await page.locator("#ncp-news-title").click();
    await expect(page.locator("#ncp-news-title")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#ncp-news-all")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#ncp-news-title")).toBeFocused();
  });

  test("Services 탭 수평", async ({ page }) => {
    await page.locator("#ncp-services-tab-0").click();
    await expect(page.locator("#ncp-services-tab-0")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#ncp-services-tab-1")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#ncp-services-tab-2")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#ncp-services-tab-1")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#ncp-services-tab-0")).toBeFocused();
  });

  test("Services 탭 → 서비스 카드", async ({ page }) => {
    // Navigate from Header Title (Left) -> Card 0 (Left)
    await page.locator("#ncp-services-title").click();
    await expect(page.locator("#ncp-services-title")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    // Should land on first card's first item (Icon or Badge)
    await expect(
      page.locator("#ncp-services-service-card-1-icon"),
    ).toBeFocused();
  });

  test("Services 서비스 카드 내부", async ({ page }) => {
    await page.locator("#ncp-services-service-card-1-item-title").click();
    await expect(page.locator("#ncp-services-service-card-1-item-title")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-services-service-card-1-item-desc")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#ncp-services-service-card-1-item-title")).toBeFocused();
  });

  test("Services 서비스 카드 수평", async ({ page }) => {
    await page.locator("#ncp-services-service-card-1-item-title").click();
    await expect(page.locator("#ncp-services-service-card-1-item-title")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#ncp-services-service-card-2-item-title")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#ncp-services-service-card-3-item-title")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#ncp-services-service-card-2-item-title")).toBeFocused();
  });

  test("News → Services 크로스존", async ({ page }) => {
    // News Title (Left) -> Services Category (Left)
    await page.locator("#ncp-news-title").click();
    await expect(page.locator("#ncp-news-title")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    // Should skip container and hit first item in News Grid (Card 0 Tag)
    await expect(page.locator("#ncp-news-item-1-tag")).toBeFocused();

    // We want to test Cross Zone, so let's go from Bottom of News -> Top of Services
    // But simplified: Just test from Services Category Back Up?
    // Or just test adjacent items.

    // Let's test News Bottom -> Services Top
    // News Card 0 (Left) -> Services Title (Left)
    // Actually News Card 0 is tall.
    // Let's just click News Title and go Down multiple times?

    // Re-evaluating: The test wanted "News -> Services".
    // News is above Services.
    // Let's use the layout:
    // News Section
    //   Header (Title, Link)
    //   Grid
    //   Card 0 (Left, Tall)
    // Services Section
    //   Header (Category, Title) (Left)

    // If we are at News Card 0 (bottom of it), Down -> Services Header.
    await page.locator("#ncp-news-item-1-desc").click(); // Bottom of Card 0
    await expect(page.locator("#ncp-news-item-1-desc")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    // Should hit Service Category or Title
    // Category is small, might be missed if alignment is off?
    // But it is above Title.
    // Let's expect one or the other, or check coverage.
    // Based on layout, Category is #ncp-service-category.
    await expect(page.locator("#ncp-services-category")).toBeFocused();
  });

  test("전체 페이지 수직 스윕", async ({ page }) => {
    // Left-side sweep
    await page.locator("#ncp-hero-title").click();
    await expect(page.locator("#ncp-hero-title")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-hero-sub")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-hero-cta")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-news-title")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    // News Title -> News Card 1 Tag (Left column)
    await expect(page.locator("#ncp-news-item-1-tag")).toBeFocused();

    // Continue down through News Card 1
    // Because continuous ArrowDown across large distances is dependent on viewport
    // scroll speed catching up with focus state, we jump to the bottom of the news container
    // to verify the cross-zone boundary into Services.
    await page.locator("#ncp-news-item-1-desc").click();
    await expect(page.locator("#ncp-news-item-1-desc")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-services-category")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-services-title")).toBeFocused();
  });
});
