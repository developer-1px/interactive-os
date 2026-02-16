import { expect, test } from "@playwright/test";

test.describe("Builder Inline Editing & Panel Sync", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/builder");
        // ncp-hero-title에 포커스를 맞추기 위해 캔버스 안을 클릭
        await page.locator("#ncp-hero-title").click();
    });

    // ═══════════════════════════════════════════════════════════════
    // T2: Canvas Inline Editing (PRD §1.2)
    //
    // OS.Field mode="deferred" 동작:
    //   - 클릭 → contentEditable 활성화
    //   - 텍스트 수정
    //   - blur (다른 요소 클릭) → onCommit 호출 → state 갱신
    //   - Escape → 취소 (원래 값 복원)
    // ═══════════════════════════════════════════════════════════════

    test("인라인 편집: 클릭 → 수정 → 다른 요소 클릭(blur)으로 저장", async ({
        page,
    }) => {
        // 1. 더블클릭으로 텍스트 안에 커서 배치 + 전체 선택
        await page.locator("#ncp-hero-title").dblclick();
        await page.keyboard.press("Meta+A");
        await page.keyboard.type("새로운 제목");

        // 2. 다른 요소 클릭 → blur → onCommit
        await page.locator("#ncp-hero-sub").click();

        // 3. 검증: 캔버스에 새 텍스트 반영
        await expect(page.locator("#ncp-hero-title")).toContainText("새로운 제목");
    });

    test("Escape로 편집 취소 시 원본 유지", async ({ page }) => {
        const original = await page.locator("#ncp-hero-title").textContent();

        await page.locator("#ncp-hero-title").dblclick();
        await page.keyboard.press("Meta+A");
        await page.keyboard.type("임시 수정");

        // Escape → 취소
        await page.keyboard.press("Escape");

        await expect(page.locator("#ncp-hero-title")).toContainText(original!);
    });

    // ═══════════════════════════════════════════════════════════════
    // T3: Panel ↔ Canvas Sync (PRD §1.3)
    // ═══════════════════════════════════════════════════════════════

    test("캔버스 선택 → 패널에 선택 ID 및 타입 표시", async ({ page }) => {
        // ncp-hero-title이 이미 beforeEach에서 클릭됨
        // 패널 헤더 확인: "text Properties" 헤딩 (role=heading)
        await expect(
            page.locator(".w-80").getByRole("heading", { name: /text/i }),
        ).toBeVisible();

        // 선택 ID가 paragraph에 표시:  "ncp-hero-title"
        await expect(
            page
                .locator(".w-80")
                .getByRole("paragraph")
                .filter({ hasText: "ncp-hero-title" }),
        ).toBeVisible();
    });

    test("패널에서 수정 → 캔버스에 실시간 반영", async ({ page }) => {
        // 패널의 textarea에 값 변경
        const textarea = page.locator(".w-80").getByRole("textbox").first();
        await expect(textarea).toBeVisible();
        await textarea.fill("패널에서 수정된 제목");

        // 캔버스 반영 확인
        await expect(page.locator("#ncp-hero-title")).toContainText(
            "패널에서 수정된 제목",
        );
    });

    test("다른 요소 선택 시 패널 ID가 전환된다", async ({ page }) => {
        // 현재: ncp-hero-title 선택
        await expect(
            page
                .locator(".w-80")
                .getByRole("paragraph")
                .filter({ hasText: "ncp-hero-title" }),
        ).toBeVisible();

        // 다른 요소 선택
        await page.locator("#ncp-hero-sub").click();

        // 패널이 새 요소로 전환
        await expect(
            page
                .locator(".w-80")
                .getByRole("paragraph")
                .filter({ hasText: "ncp-hero-sub" }),
        ).toBeVisible();
    });
});
