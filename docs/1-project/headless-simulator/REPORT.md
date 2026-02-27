# /divide Report — Vitest에서 Playwright 수준 검증 달성

## Problem Frame

| | 내용 | 확신도 |
|---|------|--------|
| **Objective** | focus-showcase e2e 25개 실패를 vitest에서 동등하게 재현+검증 가능하게 | 🟢 |
| **Constraints** | testing-library 금지 / OS 자체 API만 / DOM 직접 조작 금지 | 🟢 |
| **Variables** | OS VDOM 형태 / FocusItem attrs 추출 범위 / DOM 레이어 두께 / TestPage API | 🟡 |

## E2E Assertion 분류 (29 tests → 6 카테고리)

| 카테고리 | Assertion 형태 | 테스트 수 | headless 현황 |
|----------|---------------|----------|--------------|
| **A. aria-current** | `toHaveAttribute("aria-current", "true")` | 15 | `computeAttrs`에 **없음** ❌ |
| **B. aria-selected/checked** | `toHaveAttribute("aria-selected/checked", "true")` | 6 | `computeAttrs`에 있음 ✅ |
| **C. tabIndex roving** | `toHaveAttribute("tabindex", "0"/"-1")` | 1 | `computeAttrs`에 있음 ✅ |
| **D. data-focused** | `toHaveAttribute("data-focused", "true")` | 1 | `computeAttrs`에 있음 ✅ |
| **E. aria-expanded** | `toHaveAttribute("aria-expanded", "true/false")` | 2 | `computeAttrs`에 있음 ✅ |
| **F. toBeFocused (DOM focus)** | `toBeFocused()` (실제 DOM focus) | 4 | headless 불가 ❌ (물리) |

## Backward Chain

| Depth | Subgoal | 충족? | Evidence | 미충족 시 전제조건 |
|-------|---------|-------|----------|--------------------|
| 0 | **vitest에서 e2e 25개 동등 검증** | ❌ | Playwright 25 FAIL, vitest 0 regression | → A, B, C |
| 1 | **A: OS_NAVIGATE가 headless에서 동작** | ❌ | DOM_ITEMS 빈 배열 → navigate skip | → A1, A2 |
| 2 | A1: getItems가 Phase 1 재실행 후에도 유지 | ❌ | `FocusGroup.tsx:446` Phase 1이 덮어씀 | 🔨 **WP1: Phase 1/2 라이프사이클 수정** |
| 2 | A2: createOsPage에서 Phase 1/2 시뮬레이션 | ❌ | `createOsPage.ts` React lifecycle 없음 | → A2a |
| 3 | A2a: createOsPage가 React 없이 동일 동작 보장 | 🟡 | `createOsPage.goto()`가 getItems 직접 등록 | ※ 현재도 부분적 동작. Phase 1/2 문제가 해결되면 e2e에서는 PASS |
| 1 | **B: computeAttrs에 aria-current 추가** | ❌ | `headless.ts:351` aria-current 없음 | 🔨 **WP2: computeAttrs에 aria-current 추가** |
| 1 | **C: toBeFocused 검증을 headless에서 대체** | ❌ | DOM focus는 물리 현상 | → C1 |
| 2 | C1: OS state에서 "누가 DOM focus를 받아야 하는가" 계산 가능? | ✅ | `activeZoneId + focusedItemId + followFocus` → tabIndex=0인 아이템이 DOM focus 대상 | — |
| 2 | C2: createOsPage에 `isFocused(itemId)` API 추가 | ❌ | 현재 없음 | 🔨 **WP3: page.isFocused() 추가** |

### 깊은 분석: 왜 클릭만 하는 테스트는 PASS인가?

| 테스트 | 동작 | 결과 | 이유 |
|--------|------|------|------|
| restore | click → click → click | ✅ PASS | click은 `resolveClick` → `OS_FOCUS` (items 불필요) |
| orthogonal | click → ArrowLeft → 같은 item | ✅ PASS | navigate가 skip해도 결과 동일 (움직이지 않아야 하니까) |
| Cmd+Click | click × N | ✅ PASS | 클릭만 사용 |
| Single Toggle | click → click | ✅ PASS | 클릭만 사용 |
| **나머지 25개** | click → **ArrowDown** → 확인 | ❌ FAIL | navigate → DOM_ITEMS 빈 배열 → skip |

## Work Packages

| WP | Subgoal | 왜 필요한가 (chain) | Evidence | 우선순위 |
|----|---------|---------------------|----------|---------|
| **WP1** | Phase 1/2 라이프사이클 수정 — Phase 1 재실행 시 Phase 2의 getItems 보존 | Goal ← A ← A1. **이것만 수정하면 e2e 25개 GREEN 복구** | `FocusGroup.tsx:386-433` (Phase 1 deps 15+개) vs `FocusGroup.tsx:439` (Phase 2 deps [groupId]) | 🔴 즉시 |
| **WP2** | computeAttrs에 `aria-current` 추가 | Goal ← B. headless attrs 검증에서 현재 가장 큰 누락 | `headless.ts:326-372` — aria-current 없음. FocusItem.tsx:205에는 있음 | 🟡 단기 |
| **WP3** | page.isFocused(itemId) API | Goal ← C ← C2. toBeFocused() 4개 테스트의 headless 대체 | createOsPage에 없음 | 🟢 단기 |
| **WP4** | e2e 결과 파일 기반 읽기 | LLM이 매번 Playwright를 돌리지 않고 결과만 읽음 | Playwright --reporter=json 활용 | 🟢 DX |

## 핵심 발견

### 1. WP1이 모든 것의 선행 조건

Phase 1/2 수정만으로 **e2e 25개가 GREEN 복구**된다. 왜냐하면:
- 실패 원인 100% = `OS_NAVIGATE`가 `DOM_ITEMS` 빈 배열 → skip
- DOM_ITEMS가 빈 배열인 이유 = Phase 1이 Phase 2의 getItems를 덮어씀
- 클릭 테스트는 PASS (items 불필요) → navigate만 깨짐

### 2. computeAttrs에 aria-current가 없다

`headless.ts:computeAttrs`는 `data-focused`은 있지만 `aria-current`는 없다.
FocusItem.tsx의 `isActiveFocused = isFocused && isGroupActive`가 aria-current를 결정.
이것은 순수 함수로 추출 가능: `isFocused && (activeZoneId === zoneId)`.

### 3. toBeFocused는 OS state로 계산 가능

DOM focus는 물리적이지만, "누가 focus를 받아야 하는가"는 OS가 결정:
- `tabIndex === 0`인 아이템 = DOM focus 대상
- `activeZoneId`의 `focusedItemId` = `tabIndex 0` = DOM focus

따라서 `page.isFocused(itemId)` = `attrs(itemId).tabIndex === 0 && isActiveZone`

### 4. e2e 결과를 파일로 저장하면 LLM DX 개선

```bash
npx playwright test --reporter=json > test-results/focus-e2e.json
```
이후 LLM은 JSON만 읽으면 됨. 매번 37초 대기 불필요.

## Residual Uncertainty

- WP1의 구체적 수정 방법: Phase 1이 재등록할 때 기존 getItems를 보존하는 방향 vs Phase 1/2를 하나로 합치는 방향
- 다른 e2e spec(aria-showcase 8개, todo 5개, builder 2개 등)도 같은 패턴으로 깨져 있는지 미확인
- `computeAttrs`와 `FocusItem` 사이의 완전 동형성 보장 방법 (두 곳에서 attrs를 계산하는 것 자체가 리스크)
