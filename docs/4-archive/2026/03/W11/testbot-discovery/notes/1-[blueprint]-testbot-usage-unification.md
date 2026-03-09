# Blueprint: TestBot Usage Unification

> 작성일: 2026-03-06
> 출처: /discussion (테스트봇 전수 조사) -> /blueprint

---

## 1. Goal

**앱당 testbot 파일 1개로 3-engine(vitest/browser/Playwright) 테스트를 완전 통합한다.**

현재 UDE (Undesirable Effects):
- UDE1. 앱당 3개 파일 존재 (`testbot-*.ts` + `*-interaction.test.ts` + `*.test.ts`)
- UDE2. `todo.test.ts`가 L3(앱 통합)에서 `page.dispatch()` 사용 — verification-standards 위반
- UDE3. `*-interaction.test.ts`가 3줄 접착제 — 기계적 보일러플레이트
- UDE4. 앱 로직 테스트(CRUD, selector)와 상호작용 테스트(click/press)가 별도 파일로 분산

Done Criteria:
- 앱 테스트 = testbot-*.ts 1개 + runner .test.ts 1개 (최대 2파일)
- L3 앱 통합 테스트에서 `dispatch()` 직접 호출 0건
- 동일 스크립트가 vitest headless / browser TestBot / Playwright E2E에서 동작

---

## 2. Why

**verification-standards.md 규칙 위반 해소 + 설계 철학 완성.**

| 근거 | 출처 |
|------|------|
| "앱 통합 테스트에서 dispatch() 직접 호출 금지 — click(), keyboard.press()만 허용" | verification-standards.md L3 |
| "이 OS 위에서 이 OS를 테스트한다" | verification-standards.md #2 |
| "E2E는 블랙박스다. 내부 로직을 전혀 모르는 상태에서 검증해야 진짜 테스트다" | verification-standards.md #3 |
| dispatch 사용 시 OS Pipeline을 건너뛰어 "vitest 통과, 브라우저 실패" 거짓 GREEN | verification-standards.md L3 주석 |

---

## 3. Challenge

| # | 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|---|-------------------|-----------|---------------|
| A1 | "addTodo 같은 앱 커맨드를 테스트하려면 dispatch가 필요하다" | **무효** | UI 트리거(input fill + Enter)로 커맨드를 발사할 수 있다. projection mode가 이를 지원 |
| A2 | "selector/condition 테스트에도 page가 필요하다" | **무효** | 순수 함수는 직접 호출이 정당 (verification-standards: "순수 함수 테스트는 page 불필요"). testbot에 넣을 필요 없음 |
| A3 | "3줄 runner 파일은 제거할 수 없다" | **유효** | vitest는 `*.test.ts`를 발견. testbot-*.ts는 vitest glob에 안 잡힘. runner 파일은 필요하되 1개로 통합 |
| A4 | "앱 커맨드를 click/press로 표현하려면 UI 컴포넌트가 필요하다" | **유효** | `runScenarios(scenarios, { app, component })` — projection mode로 해결. 이미 인프라 존재 |
| A5 | "모든 앱 로직을 상호작용으로 커버할 수 있다" | **부분 유효** | CRUD/편집은 가능. 하지만 edge case(빈 텍스트 no-op, batch clipboard 등)는 UI 트리거만으로 표현이 어려울 수 있음 |

**핵심 인사이트**: A1 무효화가 전부를 바꾼다.
- `addTodo`는 dispatch가 아니라 "input에 타이핑 + Enter"로 발사 가능
- `toggleTodo`는 "item 클릭 후 Space"로 발사 가능
- 이것이 곧 testbot 스크립트가 된다

**A5의 잔여 문제**: 순수 로직 edge case(빈 텍스트, batch 등)는 두 가지 해법:
1. 앱 커맨드 단위 테스트를 L2(SDK) 레벨로 재분류 — `app.test.ts`로 유지하되 dispatch 허용
2. 상호작용으로 표현 가능한 것만 testbot, 나머지는 순수 함수 테스트

---

## 4. Ideal

### 이상적 파일 구조 (Todo 앱 예시)

```
src/apps/todo/
  testbot-todo.ts              # 상호작용 스크립트 (SSOT)
  __tests__/unit/
    todo-testbot.test.ts       # 1줄 runner: runScenarios(scenarios, { app: TodoApp, component: TodoView })
    todo-logic.test.ts          # 순수 함수만: selectors, conditions, 직접 호출 (page 불필요)
```

### 이상적 testbot-todo.ts

```ts
// testbot-todo.ts — Write once, run anywhere
export const zones = ["list", "sidebar"];
export const group = "Todo";

export const scenarios: TestScenario[] = [
  {
    zone: "list",
    role: "listbox",
    getItems: () => [...],
    scripts: [
      // OS 상호작용
      { name: "click focuses", run: async (page, expect, items) => { ... } },
      { name: "ArrowDown navigates", run: async (page, expect, items) => { ... } },
      // 앱 상호작용 (dispatch 대신 UI 제스처)
      { name: "Space toggles check", run: async (page, expect, items) => { ... } },
      { name: "Delete removes item", run: async (page, expect, items) => { ... } },
    ],
  },
];
```

### 이상적 todo-logic.test.ts

```ts
// 순수 함수만 — dispatch/page 불필요
import { visibleTodos, stats, categories } from "@apps/todo/app";

describe("Selectors", () => {
  test("visibleTodos filters by category", () => {
    const result = visibleTodos.select(mockState);
    expect(result.length).toBe(3);
  });
});
```

### Negative Branch

- **NB1**: projection mode에서 `fill()` API가 아직 없을 수 있음 -> 먼저 headless page에 fill 지원 확인 필요
- **NB2**: builder는 builderBlock role이 headless 미지원 -> browser TestBot 전용 유지 (이미 알려진 제약)
- **NB3**: 상호작용으로 표현 불가한 edge case -> 순수 함수 테스트(todo-logic.test.ts)로 분리, L3 dispatch 금지 유지

---

## 5. Inputs

| 종류 | 항목 | 위치 |
|------|------|------|
| 규칙 | L3 dispatch 금지 | `.agent/knowledge/verification-standards.md` |
| 규칙 | TestScript ONE Format | `.agent/knowledge/verification-standards.md` |
| 인프라 | `runScenarios(scenarios, { app, component })` | `packages/os-devtool/src/testing/runScenarios.ts` |
| 인프라 | `createPage(app, component)` | `packages/os-devtool/src/testing/page.ts` |
| 대상 | Todo 앱 | `src/apps/todo/` |
| 대상 | DocsViewer 앱 | `src/docs-viewer/` |
| 대상 | Builder 앱 | `src/apps/builder/` |
| 대상 | Inspector 앱 | `src/inspector/` |
| 대상 | CommandPalette | `src/command-palette/` |
| 감사 결과 | L1-L4 레거시 4건 | 이 세션의 전수 조사 |

---

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|---|------|------|-----|--------|---------|
| G1 | `todo.test.ts`의 CRUD를 상호작용으로 표현 | dispatch 기반 테스트 57개 | L3 위반 테스트를 (a) testbot 이관 또는 (b) 순수 함수로 재분류 | **High** | G3 |
| G2 | 3줄 runner 보일러플레이트 통합 | 앱당 별도 runner 파일 | runner 1개로 통합 (이미 해결 가능) | Low | - |
| G3 | headless page에서 앱 커맨드 트리거 가능 | `runScenarios({ app, component })` 존재 | fill/type API, Trigger 클릭 등 projection 검증 | **High** | - |
| G4 | `headless-smoke.test.ts` 레거시 전환 | `os.getState/setState/dispatch` 직접 | `createPage(BuilderApp)` 전환 | Med | - |
| G5 | `command-palette.test.ts` 레거시 전환 | `os.dispatch/getState/setState` 직접 | `createPage(CommandPaletteApp)` 전환 | Med | - |
| G6 | `docs-history.test.ts` 레거시 전환 | `os.dispatch/setState` + DOM mock | `createPage(DocsApp)` 전환 또는 순수 함수 추출 | Med | G3 |
| G7 | `docs-scroll.test.ts` 레거시 전환 | `os.dispatch/setState` + DOM mock | 스크롤 추상화 OS gap — 보류 또는 순수 함수 추출 | Med | OS gap |
| G8 | selector/condition 테스트를 순수 함수로 분리 | `todo.test.ts`에 dispatch와 혼재 | 순수 함수 부분 추출 → `todo-logic.test.ts` | Low | - |

---

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|---|------|--------|---------|-------------|
| T1 | G3 검증: projection mode 능력 확인 | Complicated | - | `createPage(TodoApp, TodoView)` + `page.locator().click()`으로 addTodo 트리거 가능한지 spike |
| T2 | G8: 순수 함수 분리 | Clear | - | `todo.test.ts`에서 selector/condition 테스트를 `todo-logic.test.ts`로 추출. dispatch 제거 |
| T3 | G1: Todo CRUD를 testbot 이관 | Complicated | T1 | addTodo/deleteTodo/toggleTodo를 상호작용(click/press)으로 재작성. testbot-todo.ts에 통합 |
| T4 | G4: builder headless-smoke 전환 | Clear | - | `os.getState/dispatch` → `createPage(BuilderApp)` |
| T5 | G5: command-palette 전환 | Complicated | - | `os.dispatch/getState/setState` → `createPage(CommandPaletteApp)` + click/press |
| T6 | G6: docs-history 전환 | Complicated | T1 | 히스토리 네비게이션을 상호작용으로 재작성, 또는 순수 함수 추출 |
| T7 | G7: docs-scroll 판정 | Complex | - | 스크롤 추상화 OS gap 확인. 해결 가능하면 전환, 불가하면 OS gap 등록 + 보류 |
| T8 | G2: runner 보일러플레이트 통합 | Clear | T3 | 앱당 runner를 1개로 통합, 네이밍 표준화 |

**크리티컬 패스**: T1 → T3 (Todo 앱이 proof-of-concept)

T1이 성공하면 나머지는 같은 패턴 적용. T1이 실패하면 headless page의 projection API를 확장해야 하므로 OS gap으로 전환.
