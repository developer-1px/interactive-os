import { expect, test } from "@playwright/test";

test.describe("Builder Inline Editing & Panel Sync", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/builder");
    await page.locator("#ncp-hero-title").click();
  });

  // ═══════════════════════════════════════════════════════════════
  // T2: 편집 진입/취소 (기존)
  // ═══════════════════════════════════════════════════════════════

  test("F2로 deferred field 편집 모드 진입 (contentEditable + data-editing)", async ({
    page,
  }) => {
    const field = page.locator("#ncp-hero-title");
    await expect(field).toHaveAttribute("contenteditable", "false");
    await expect(field).not.toHaveAttribute("data-editing", "true");

    await page.keyboard.press("F2");

    await expect(field).toHaveAttribute("contenteditable", "true");
    await expect(field).toHaveAttribute("data-editing", "true");
  });

  test("Escape로 편집 취소 시 contentEditable + data-editing 복원", async ({
    page,
  }) => {
    const field = page.locator("#ncp-hero-title");

    await page.keyboard.press("F2");
    await expect(field).toHaveAttribute("contenteditable", "true");
    await expect(field).toHaveAttribute("data-editing", "true");

    await page.keyboard.press("Escape");

    await expect(field).toHaveAttribute("contenteditable", "false");
    await expect(field).not.toHaveAttribute("data-editing", "true");
  });

  // ═══════════════════════════════════════════════════════════════
  // T4: 인라인 편집 저장/취소 전체 사이클
  // ═══════════════════════════════════════════════════════════════

  test("F2 → 텍스트 입력 → Enter → 편집 모드 종료", async ({ page }) => {
    const field = page.locator("#ncp-hero-title");

    // 편집 진입
    await page.keyboard.press("F2");
    await expect(field).toHaveAttribute("contenteditable", "true");

    // Select all + type new text
    await page.keyboard.press("Meta+A");
    await page.keyboard.type("New Title");

    // Enter → OS_FIELD_COMMIT → 편집 종료
    await page.keyboard.press("Enter");

    // 편집 모드 종료 확인
    await expect(field).toHaveAttribute("contenteditable", "false");
  });

  test("F2 → 텍스트 수정 → Escape → 원본 텍스트 복원", async ({ page }) => {
    const field = page.locator("#ncp-hero-title");
    const original = await field.textContent();

    // 편집 진입
    await page.keyboard.press("F2");
    await expect(field).toHaveAttribute("contenteditable", "true");

    // 텍스트 변경
    await page.keyboard.press("Meta+A");
    await page.keyboard.type("This should be reverted");

    // Escape → OS_FIELD_CANCEL → 복원
    await page.keyboard.press("Escape");

    // 원본 복원
    await expect(field).toContainText(original!);
  });

  // ═══════════════════════════════════════════════════════════════
  // T3: 패널 Accordion — 캔버스 선택 시 블록 자동 펼침
  // ═══════════════════════════════════════════════════════════════

  test("캔버스 선택 → 패널에서 해당 블록 Accordion이 펼침", async ({
    page,
  }) => {
    // Hero 아이템 클릭 후, Panel의 Hero accordion section이 펼쳐져야 함
    const panel = page.locator(".w-80");

    // Hero section button should exist and Hero fields should be visible
    const heroSection = panel.getByRole("button", { name: /Hero/i }).first();
    await expect(heroSection).toBeVisible();

    // Hero block's fields should be visible (auto-expanded because focused)
    const titleInput = panel
      .locator(
        "label:has-text('Title') + input, label:has-text('Title') + textarea",
      )
      .first();
    await expect(titleInput).toBeVisible();
  });

  test("패널 필드 수정 → 캔버스에 실시간 반영", async ({ page }) => {
    // Wait for Hero section to auto-expand after click
    const panel = page.locator(".w-80");
    const titleInput = panel
      .locator("label:has-text('Title')")
      .first()
      .locator("..")
      .locator("textarea, input")
      .first();
    await expect(titleInput).toBeVisible();

    await titleInput.fill("패널에서 수정된 제목");

    await expect(page.locator("#ncp-hero-title")).toContainText(
      "패널에서 수정된 제목",
    );
  });

  test("다른 요소 선택 시 패널에서 해당 블록 섹션 펼침", async ({ page }) => {
    // Initially at Hero
    const panel = page.locator(".w-80");
    const heroSection = panel.getByRole("button", { name: /Hero/i }).first();
    await expect(heroSection).toBeVisible();

    // Click News element
    await page.locator("#ncp-news-title").click();

    // News section should auto-expand
    const newsSection = panel.getByRole("button", { name: /News/i }).first();
    await expect(newsSection).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════
  // T5: 캔버스 편집 → 패널 반영
  // ═══════════════════════════════════════════════════════════════

  test("패널 수정 후 다른 요소로 이동 → 값이 유지", async ({ page }) => {
    // Wait for Hero fields
    const panel = page.locator(".w-80");
    const titleInput = panel
      .locator("label:has-text('Title')")
      .first()
      .locator("..")
      .locator("textarea, input")
      .first();
    await expect(titleInput).toBeVisible();

    await titleInput.fill("Persistent Title");

    // 캔버스에 반영 확인
    await expect(page.locator("#ncp-hero-title")).toContainText(
      "Persistent Title",
    );

    // 다른 요소 선택
    await page.locator("#ncp-hero-sub").click();

    // 다시 원래 요소로
    await page.locator("#ncp-hero-title").click();

    // 값 유지 확인
    await expect(page.locator("#ncp-hero-title")).toContainText(
      "Persistent Title",
    );
  });

  // ═══════════════════════════════════════════════════════════════
  // T6: 크로스 블록 편집
  // ═══════════════════════════════════════════════════════════════

  test("Hero 블록 수정 → News 블록으로 이동 → 각각 값 유지", async ({
    page,
  }) => {
    const panel = page.locator(".w-80");

    // Hero 제목 수정 (패널)
    const heroTitleInput = panel
      .locator("label:has-text('Title')")
      .first()
      .locator("..")
      .locator("textarea, input")
      .first();
    await expect(heroTitleInput).toBeVisible();
    await heroTitleInput.fill("Modified Hero Title");
    await expect(page.locator("#ncp-hero-title")).toContainText(
      "Modified Hero Title",
    );

    // News 블록의 제목 요소로 이동
    await page.locator("#ncp-news-title").click();

    // News 섹션이 자동 펼침
    const newsFields = panel
      .locator("label:has-text('Title')")
      .first()
      .locator("..")
      .locator("textarea, input")
      .first();
    await expect(newsFields).toBeVisible();

    // News 제목 수정
    await newsFields.fill("Modified News Title");
    await expect(page.locator("#ncp-news-title")).toContainText(
      "Modified News Title",
    );

    // Hero로 돌아가서 값 유지 확인
    await page.locator("#ncp-hero-title").click();
    await expect(page.locator("#ncp-hero-title")).toContainText(
      "Modified Hero Title",
    );
  });
});
