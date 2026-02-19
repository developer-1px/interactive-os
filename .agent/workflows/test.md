---
description: 3단계(Unit/TestBot/E2E) 테스트 전략에 따라 테스트 코드를 작성한다. OS Dogfooding 철학을 준수하여 로직 검증은 Headless Kernel 위에서 수행한다.
---

> **이론적 기반**: Test Pyramid (Mike Cohn, *Succeeding with Agile*)
> 빠른 테스트를 많이, 느린 테스트를 적게. Unit ▶▶▶ Integration ▶▶ E2E ▶

1. **테스트 레벨 결정** (Test Pyramid 비율을 의식한다)
   사용자의 요청이나 변경 사항의 성격에 따라 테스트 레벨을 결정한다.
   **비율 원칙**: 로직 검증은 최대한 Unit/Integration(Headless Kernel)에서 해결하고, E2E는 Glue Code(렌더링, 이벤트 바인딩)만 검증한다.

   - **Level 1: Unit (Handler)**
     - 대상: 개별 Command Handler의 로직 검증
     - 런타임: **Vitest + Headless Kernel**
     - 목적: 특정 Command 실행 시 State Mutation이 정확한지 검증

   - **Level 2: Integration (OS×App)**
     - 대상: OS 커맨드가 앱 커맨드를 호출하여 **최종 상태가 올바른지** 검증
     - 런타임: **Vitest + Headless Kernel**
     - 목적: 수직 통합 — "dispatch가 N번 된다"(수단)가 아니라 "N개가 실제로 처리된다"(목적)를 검증
     - 예시: OS_CUT × 3아이템 → paste → 3개 복원되는가?

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

3. **Level 2: Integration (OS×App + Seam)**
   - 대상 A: **Command Flow** — OS 커맨드가 앱 커맨드를 호출하여 **최종 상태가 올바른지** 검증
   - 대상 B: **Seam** — 모듈 경계(React ↔ vanilla store, listener ↔ registry)의 계약 검증
   - 런타임: **Vitest + Headless Kernel** (DOM 불필요)
   - 위치: `{slice}/tests/integration/[scenario].test.ts`
   - 목적: 각 부품이 합성(compose)될 때 올바른지 검증

   **Seam이란?** 두 모듈이 만나는 경계. 각 모듈의 유닛 테스트가 통과해도, 경계에서 계약이 깨질 수 있다.
   대표 사례: `FieldRegistry.register/unregister` lifecycle과 `Field.tsx`의 `useEffect` 의존성 사이의 동기화.

   **Seam 테스트 대상 식별 기준:**
   - React component가 vanilla store(FieldRegistry, ZoneRegistry)와 상호작용하는 곳
   - useEffect cleanup/setup 사이클이 외부 상태에 영향을 주는 곳
   - kernel dispatch → state 변경 → React re-render → 부수효과 체인

   **Command Flow 패턴:**
   ```ts
   describe("Scenario: [ScenarioName]", () => {
     it("should complete the flow", async () => {
       const kernel = new Kernel();
       await kernel.dispatch({ type: "CMD_1" });
       await kernel.dispatch({ type: "CMD_2" });
       expect(kernel.store.getState().[result]).toBe([finalState]);
     });
   });
   ```

   **Seam 패턴:**
   ```ts
   describe("FieldRegistry seam: lifecycle", () => {
     it("re-register preserves localValue", () => {
       FieldRegistry.register("DRAFT", { name: "DRAFT" });
       FieldRegistry.updateValue("DRAFT", "typed text");
       // Simulates re-render with new config (same name)
       FieldRegistry.register("DRAFT", { name: "DRAFT", onSubmit: newFn });
       expect(FieldRegistry.getField("DRAFT")!.state.localValue).toBe("typed text");
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
