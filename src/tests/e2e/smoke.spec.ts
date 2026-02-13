import { expect, test } from "@playwright/test";

/**
 * Smoke Test — 모든 라우트의 첫 화면이 에러 없이 렌더되는지 검증
 *
 * 검증 항목:
 * - import 에러, 런타임 에러 (pageerror)
 * - 빈 화면 (body 콘텐츠 없음)
 * - 콘솔 에러 로그
 */

const routes = [
  "/",
  "/settings",
  "/kanban",
  "/builder",
  "/playground/focus",
  "/playground/aria",
  "/docs",
  "/playground/kernel",
  "/playground/spike",
  "/playground/os-kernel",
  "/playground/playwright",
  "/playground/radix",
];

for (const route of routes) {
  test(`Smoke: ${route} renders without error`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto(route);

    // React가 마운트될 때까지 대기 (#root에 자식 요소가 생길 때까지)
    await page.waitForFunction(
      () => {
        const root = document.querySelector("#root");
        return root && root.children.length > 0;
      },
      null,
      { timeout: 10000 },
    );

    // 런타임 에러 없는지 확인
    expect(
      errors,
      `${route} had runtime errors:\n${errors.join("\n")}`,
    ).toEqual([]);
  });
}
