import { expect, test } from "@playwright/test";

test.describe("Builder Spatial Navigation", () => {
  test.beforeEach(async ({ page }) => {
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
    await expect(page.locator("#nav-login")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#nav-signup")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#nav-login")).toBeFocused();
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
    await page.locator("#tab-0").click();
    await expect(page.locator("#tab-0")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-1")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-2")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tab-1")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tab-0")).toBeFocused();
  });

  test("Services 탭 → 서비스 카드", async ({ page }) => {
    await page.locator("#tab-0").click();
    await expect(page.locator("#tab-0")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#service-title-0")).toBeFocused();
  });

  test("Services 서비스 카드 내부", async ({ page }) => {
    await page.locator("#service-title-0").click();
    await expect(page.locator("#service-title-0")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#service-desc-0")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#service-title-0")).toBeFocused();
  });

  test("Services 서비스 카드 수평", async ({ page }) => {
    await page.locator("#service-title-0").click();
    await expect(page.locator("#service-title-0")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#service-title-1")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#service-title-2")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#service-title-1")).toBeFocused();
  });

  test("News → Services 크로스존", async ({ page }) => {
    await page.locator("#ncp-news-all").click();
    await expect(page.locator("#ncp-news-all")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-service-title")).toBeFocused();
  });

  test("전체 페이지 수직 스윕", async ({ page }) => {
    await page.locator("#ncp-hero-title").click();
    await expect(page.locator("#ncp-hero-title")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-hero-sub")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-hero-cta")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-news-title")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-news-all")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#ncp-service-title")).toBeFocused();
  });
});
