---
description: 3단계(Unit/TestBot/E2E) 테스트 전략에 따라 테스트 코드를 작성한다. OS Dogfooding 철학을 준수하여 로직 검증은 Headless Kernel 위에서 수행한다.
---

1. **테스트 레벨 결정**
   사용자의 요청이나 변경 사항의 성격에 따라 테스트 레벨을 결정한다.

   - **Level 1: Unit (Handler)**
     - 대상: 개별 Command Handler의 로직 검증
     - 런타임: **Vitest + Headless Kernel**
     - 목적: 특정 Command 실행 시 State Mutation이 정확한지 검증

   - **Level 2: TestBot (Command Flow)**
     - 대상: 여러 Command가 연쇄되는 시나리오 (Saga)
     - 런타임: **Vitest + Headless Kernel (Virtual User)**
     - 목적: UI 없이 커널 위에서 비즈니스 로직의 흐름(Flow) 검증

   - **Level 3: E2E (Browser)**
     - 대상: 실제 렌더링 및 사용자 인터랙션 (Glue Code)
     - 런타임: **Playwright + TestBot**
     - 목적: 실제 브라우저 환경에서 컴포넌트 마운트, 이벤트 바인딩, 시각적 피드백 검증

2. **Level 1: Unit (Handler) 작성 가이드**
   - 위치: `{slice}/tests/unit/[handler].test.ts` (슬라이스 안에 co-locate)
   - 패턴:
     ```ts
     import { describe, it, expect } from "vitest";
     import { Kernel } from "@kernel";

     describe("Handler: [CommandName]", () => {
       it("should mutate state correctly", async () => {
         const kernel = new Kernel();
         // Setup initial state if needed
         
         await kernel.dispatch({ type: "[CommandName]", payload: { ... } });
         
         const state = kernel.store.getState();
         expect(state.[path]).toBe([expectedValue]);
       });
     });
     ```

3. **Level 2: TestBot (Command Flow) 작성 가이드**
   - 위치: `{slice}/tests/testbot/[scenario].test.ts` (슬라이스 안에 co-locate)
   - 패턴:
     ```ts
     import { describe, it, expect } from "vitest";
     import { Kernel } from "@kernel";
     // VirtualUser 등 헬퍼가 있다면 활용

     describe("Scenario: [ScenarioName]", () => {
       it("should complete the flow", async () => {
         const kernel = new Kernel();
         
         // Step 1
         await kernel.dispatch({ type: "CMD_1" });
         // Step 2
         await kernel.dispatch({ type: "CMD_2" });
         
         expect(kernel.store.getState().[result]).toBe([finalState]);
       });
     });
     ```

4. **Level 3: E2E (Playwright) 작성 가이드**
   - 위치: `{slice}/tests/e2e/[name].spec.ts` (슬라이스 안에 co-locate)
   - 패턴:
     ```ts
     import { expect, test } from "@playwright/test";

     test.describe("E2E: [Feature]", () => {
       test.beforeEach(async ({ page }) => {
         await page.goto("/[route]");
         // Wait for React hydration
       });

       test("should render and interact", async ({ page }) => {
         // Use TestBot or semantic locators
         await page.getByRole("button", { name: "Save" }).click();
         await expect(page.getByText("Success")).toBeVisible();
       });
     });
     ```

5. **검증**
   - Unit/Integration: `npm run test` (Vitest)
   - E2E: `npm run test:e2e` (Playwright)
