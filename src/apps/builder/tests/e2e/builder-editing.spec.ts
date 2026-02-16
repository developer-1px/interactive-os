import { expect, test } from "@playwright/test";

test.describe("Builder Inline Editing & Panel Sync", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/builder");
        await page.locator("#ncp-hero-title").click();
    });

    // ═══════════════════════════════════════════════════════════════
    // T2: Canvas Inline Editing (PRD §1.2)
    //
    // OS.Field mode="deferred" + OS keybinding:
    //   - F2 (navigating) → FIELD_START_EDIT → editingItemId set → contentEditable on
    //   - Escape (editing) → FIELD_CANCEL → revert
    // ═══════════════════════════════════════════════════════════════

    test("F2로 deferred field 편집 모드 진입 (contentEditable)", async ({
        page,
    }) => {
        const field = page.locator("#ncp-hero-title");

        // 초기: navigating, contentEditable=false
        await expect(field).toHaveAttribute("contenteditable", "false");

        // F2 → FIELD_START_EDIT → editing mode
        await page.keyboard.press("F2");

        // contentEditable이 true로 전환됨
        await expect(field).toHaveAttribute("contenteditable", "true");
    });

    test("Escape로 편집 취소 시 contentEditable false로 복원", async ({
        page,
    }) => {
        const field = page.locator("#ncp-hero-title");

        // F2로 편집 진입
        await page.keyboard.press("F2");
        await expect(field).toHaveAttribute("contenteditable", "true");

        // Escape → FIELD_CANCEL
        await page.keyboard.press("Escape");

        // contentEditable이 false로 복원
        await expect(field).toHaveAttribute("contenteditable", "false");
    });

    // ═══════════════════════════════════════════════════════════════
    // T3: Panel ↔ Canvas Sync (PRD §1.3)
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
});
