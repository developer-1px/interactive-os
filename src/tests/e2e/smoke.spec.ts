import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

/**
 * Smoke Test — 모든 라우트의 첫 화면이 에러 없이 렌더되는지 검증
 *
 * 라우트 목록은 routeTree.gen.ts의 FileRoutesByFullPath에서 자동 추출.
 * 라우트 추가/삭제 시 TanStack Router가 파일을 재생성하므로 수동 동기화 불필요.
 *
 * 검증 항목:
 * - import 에러, 런타임 에러 (pageerror)
 * - 빈 화면 (#root 콘텐츠 없음)
 */

// routeTree.gen.ts에서 fullPath 목록을 자동 추출
const genFilePath = path.resolve(__dirname, "../routeTree.gen.ts");
const genFile = fs.readFileSync(genFilePath, "utf-8");
const fullPathBlock = genFile.match(
  /interface FileRoutesByFullPath \{([\s\S]*?)\}/,
)?.[1];
const allRoutes = [...(fullPathBlock?.matchAll(/'([^']+)'/g) ?? [])].map(
  (m) => m[1],
);

// splat($) 라우트, 중복 trailing slash 제외
const smokeRoutes = allRoutes.filter(
  (r) => !r.includes("$") && !r.endsWith("/"),
);

for (const route of smokeRoutes) {
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
