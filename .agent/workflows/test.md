---
description: 대상 컴포넌트/페이지의 E2E 테스트를 Playwright spec으로 자동 생성한다. ShimPage가 TestBot 변환을 처리하여 브라우저에서도 실행 가능.
---

1. **대상 파악**
   - `/test` 뒤에 지정된 컴포넌트/페이지/라우트를 식별한다.
   - 미지정 시 → 현재 열려있는 파일 기반으로 대상을 추론한다.

2. **패턴 참조**
   - 참조 파일: `e2e/aria-showcase/tabs.spec.ts`, `e2e/playground/dialog.spec.ts`
   - 구조:
     - `import { expect, test } from "@playwright/test"`
     - `test.describe("그룹", () => { ... })`
     - `test.beforeEach` — `page.goto("/route")` + React 마운트 대기
     - `test("이름", async ({ page }) => { ... })`
   - **순수 Playwright API만 사용**: `page.locator`, `page.getByText`, `page.getByRole`,
     `page.keyboard.press`, `expect(locator).toHaveAttribute()` 등
   - ❌ TestActions 직접 사용 금지 (ShimPage가 자동 변환)

3. **대상 코드 분석**
   - 대상 컴포넌트 소스를 읽고 테스트 시나리오를 식별:
     - 렌더링 검증
     - 키보드 네비게이션 (Arrow, Tab, Home/End, Escape)
     - 클릭 인터랙션
     - ARIA 속성 검증 (aria-selected, aria-current, aria-disabled 등)
     - 다이얼로그/포커스 복원 등 OS 동작

4. **Playwright spec 생성**
   - 위치: `e2e/[category]/[name].spec.ts`
   - `test.beforeEach`에 `page.goto()` + React 마운트 대기 패턴 포함:
     ```ts
     test.beforeEach(async ({ page }) => {
       await page.goto("/route");
       await page.waitForFunction(
         () => document.querySelector("#root")?.children.length! > 0,
         null, { timeout: 10000 }
       );
     });
     ```
   - 테스트 간 주석 구분선 사용 (기존 스타일)

5. **브라우저 TestBot 등록**
   - 해당 페이지 컴포넌트에서 spec을 import + `usePlaywrightSpecs` 등록:
     ```tsx
     // @ts-expect-error
     import runNewSpec from "../../e2e/[category]/[name].spec.ts";
     usePlaywrightSpecs("page-id", [runNewSpec]);
     ```
   - 또는 `PlaywrightRunnerPage.tsx`에 추가

6. **검증**
   // turbo
   - `npx tsc --noEmit` — 타입 체크
   // turbo
   - `npx playwright test e2e/[생성된 spec]` — Playwright CLI 실행
   - 실패 시 수정 후 재실행

7. **결과 보고**
   - 생성된 파일 목록 + 테스트 케이스 수/통과 수 요약
