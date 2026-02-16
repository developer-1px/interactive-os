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

        // Enter → FIELD_COMMIT → 편집 종료
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

        // Escape → FIELD_CANCEL → 복원
        await page.keyboard.press("Escape");

        // 원본 복원
        await expect(field).toContainText(original!);
    });

    // ═══════════════════════════════════════════════════════════════
    // T3: 패널 ↔ 캔버스 양방향 동기화 (기존)
    // ═══════════════════════════════════════════════════════════════

    test("캔버스 선택 → 패널에 선택 ID 및 타입 표시", async ({ page }) => {
        const panelHeader = page
            .locator(".w-80")
            .getByRole("heading", { level: 2 });
        await expect(panelHeader).toContainText("text", { ignoreCase: true });

        await expect(
            page
                .locator(".w-80")
                .getByRole("paragraph")
                .filter({ hasText: "ncp-hero-title" }),
        ).toBeVisible();
    });

    test("패널 textarea 수정 → 캔버스에 실시간 반영", async ({ page }) => {
        const textarea = page.locator(".w-80").getByRole("textbox").first();
        await expect(textarea).toBeVisible();
        await textarea.fill("패널에서 수정된 제목");

        await expect(page.locator("#ncp-hero-title")).toContainText(
            "패널에서 수정된 제목",
        );
    });

    test("다른 요소 선택 시 패널 ID 전환", async ({ page }) => {
        await expect(
            page
                .locator(".w-80")
                .getByRole("paragraph")
                .filter({ hasText: "ncp-hero-title" }),
        ).toBeVisible();

        await page.locator("#ncp-hero-sub").click();

        await expect(
            page
                .locator(".w-80")
                .getByRole("paragraph")
                .filter({ hasText: "ncp-hero-sub" }),
        ).toBeVisible();
    });

    // ═══════════════════════════════════════════════════════════════
    // T5: 캔버스 편집 → 패널 반영
    // ═══════════════════════════════════════════════════════════════

    test("패널 수정 후 다른 요소로 이동 → 값이 유지", async ({ page }) => {
        // 패널에서 제목 수정
        const textarea = page.locator(".w-80").getByRole("textbox").first();
        await textarea.fill("Persistent Title");

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
        // Hero 제목 수정 (패널)
        const textarea = page.locator(".w-80").getByRole("textbox").first();
        await textarea.fill("Modified Hero Title");
        await expect(page.locator("#ncp-hero-title")).toContainText(
            "Modified Hero Title",
        );

        // News 블록의 제목 요소로 이동
        await page.locator("#ncp-news-title").click();

        // 패널이 News 요소로 전환
        await expect(
            page
                .locator(".w-80")
                .getByRole("paragraph")
                .filter({ hasText: "ncp-news-title" }),
        ).toBeVisible();

        // News 제목 수정
        const newsTextarea = page.locator(".w-80").getByRole("textbox").first();
        await newsTextarea.fill("Modified News Title");
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
