# /divide Report — Headless Zone Registry

## Problem Frame

| | 내용 |
|---|------|
| **Objective** | FocusGroup의 Zone 등록을 DOM-free headless 경로로 전환하여, Vitest에서 브라우저 없이 Zone 생명주기를 완전히 테스트 가능하게 한다 |
| **Constraints** | C1: 기존 브라우저 렌더링 동작 불변. C2: `createPage`(headless) 경로와 React 렌더링 경로가 동일 ZoneRegistry를 사용. C3: rules.md Rule 2 (로직 먼저, 뷰는 바인딩) |
| **Variables** | V1: Zone 등록 시점 (render-time vs layout-effect). V2: DOM element 바인딩 시점. V3: autoFocus 메커니즘. V4: FocusItem DOM focus 경로. V5: Field DOM 조작 격리 |

## Backward Chain

| Depth | Subgoal | 충족? | Evidence | 미충족 시 전제조건 |
|-------|---------|-------|----------|--------------------|
| 0 | Headless에서 Zone 등록 가능 | ❌ | FocusGroup.tsx:383 — `if (containerRef.current)` 가드 | → A(논리 등록 분리), B(이중 경로 제거) |
| 1 | A: Zone 논리 등록이 DOM 불필요 | ❌ | FocusGroup.tsx:383-408 — `useLayoutEffect`에서 `containerRef.current`를 `buildZoneEntry`에 필수 인자로 전달 | → A1(useMemo 등록), A2(element lazy binding) |
| 2 | A1: 커널 상태 초기화가 render-time에 이미 실행됨 | ✅ | FocusGroup.tsx:378-380 — `useMemo(() => { os.dispatch(OS_ZONE_INIT(groupId)); })` — 이미 render-time | — |
| 2 | A2: ZoneEntry 타입이 element optional 허용 | ✅ | zoneRegistry.ts:43 — `element?: HTMLElement \| null` — 이미 선언 | — |
| 2 | A3: ZoneRegistry.register가 element 없이 동작 | ✅ | zoneRegistry.ts:107-110 — element 접근 없음, Map.set만 수행 | — |
| 2 | A4: FocusGroup가 callback/config를 element 없이 등록 가능 | ❌ | FocusGroup.tsx:383 — `if (containerRef.current)` 블록 내부에 config+callbacks 등록이 몰려있음. element가 없으면 config도 등록 안 됨 | 🔨 **T1: useMemo로 논리 등록 이동** |
| 1 | B: headless goto()와 브라우저 FocusGroup이 동일 등록 경로 사용 | ❌ | defineApp.page.ts:145-169 vs FocusGroup.tsx:383-408 — 완전히 별도 코드. 구조 유사하지만 독립 경로 | → B1(공유 등록 함수), B2(autoFocus 통합) |
| 2 | B1: 공유 등록 로직 추출 가능 | ❌ | defineApp.page.ts:145-169의 register 로직과 FocusGroup.tsx:383-408의 buildZoneEntry가 동일 구조이나 별개 함수. 공유 없음 | 🔨 **T4: 이중 경로 제거** |
| 2 | B2: autoFocus가 DOM querySelector에 의존하지 않음 | ❌ | FocusGroup.tsx:439-460 — `containerRef.current?.querySelector('[data-focus-item]')` — 순수 DOM 쿼리 | 🔨 **T2: getItems() headless 경로** |
| 1 | C: FocusItem DOM focus가 headless-safe | ❌ | FocusItem.tsx:169-176 — `useLayoutEffect` 내 `internalRef.current.focus()`. 4-effects/index.ts:22-28도 별도 `findItemElement()→.focus()` | → C1 |
| 2 | C1: DOM focus가 effect 계층으로 통합 가능 | ❌ | FocusItem.tsx:169 vs 4-effects/index.ts:22 — 두 경로 모두 물리 DOM `.focus()` 호출. headless에서 불필요하지만 분리 안 됨 | 🔨 **T3: FocusItem DOM focus 통합** |
| 1 | D: Field DOM 조작이 headless에서 안전 | ❌ | — | → D1, D2 |
| 2 | D1: isParentEditing의 DOM contains() 체크 | ❌ | Field.tsx:263-270 — `document.getElementById(parentEditingCandidate)` + `editingEl?.contains(innerRef.current)` — 순수 DOM | 🔨 **T5: headless 대안** |
| 2 | D2: useFieldHooks의 DOM 직접 조작 | ❌ | useFieldHooks.ts:57-70 — `innerRef.current.innerText = localValue`, `.focus()`, `.blur()`, `getCaretPosition()` — 전부 브라우저 전용 | 🔨 **T6: headless-safe 격리** |
| 3 | D2-a: FieldRegistry가 DOM 없이 값 관리 가능 | ✅ | FieldRegistry.ts — Zustand store, DOM 무관 | — |
| 3 | D2-b: caret/selection DOM API가 headless에서 필요한가 | ✅ (불필요) | headless에서 caret은 무의미. defineApp.page.ts:240 — `FieldRegistry.updateValue`로 충분 | — |

## Work Packages

| WP | Task | Subgoal | 왜 필요한가 (chain) | Evidence |
|----|------|---------|-------------------|----------|
| T1 | FocusGroup Zone 논리 등록을 useMemo로 이동 | A4 | Goal ← A ← A4: config+callbacks 등록이 DOM 가드 안에 갇혀 있음 | FocusGroup.tsx:383 |
| T2 | autoFocus를 getItems() headless 경로로 전환 | B2 | Goal ← B ← B2: `querySelector('[data-focus-item]')`가 DOM 전용 | FocusGroup.tsx:446-450 |
| T3 | FocusItem DOM focus steal 통합 검토 | C1 | Goal ← C ← C1: FocusItem.useLayoutEffect와 4-effects/focus 이중 경로 | FocusItem.tsx:169, 4-effects/index.ts:22 |
| T4 | goto() 이중 등록 경로 제거 | B1 | Goal ← B ← B1: defineApp.page.ts와 FocusGroup가 동일 구조를 별도 구현 | defineApp.page.ts:145-169 |
| T5 | Field isParentEditing DOM contains() 대안 | D1 | Goal ← D ← D1: `document.getElementById` + `contains()` = 브라우저 전용 | Field.tsx:263-270 |
| T6 | useFieldHooks DOM 조작 headless-safe 격리 | D2 | Goal ← D ← D2: innerText/focus/blur/caret 전부 브라우저 API | useFieldHooks.ts:57-70 |

## Priority

**T1 > T4 > T2 > T3 > T5 > T6**

- T1이 가장 핵심 — Zone 등록 자체를 headless로 풀면 나머지가 자연스럽게 따라옴
- T4는 T1의 결과를 goto()에도 적용하는 것 (이중 경로 제거)
- T2는 autoFocus 보조
- T3~T6은 점진적 개선 (Field DOM 조작은 브라우저 전용으로 유지해도 headless 테스트에 큰 지장 없음)

## Residual Uncertainty

- T3의 범위: FocusItem의 DOM focus와 4-effects/focus를 완전 통합할지, FocusItem 쪽만 effect 경로로 전환할지 — 이것은 구현 시 판단 (Complicated, 분석하면 답이 좁혀짐)
- T5/T6의 ROI: Field의 contentEditable DOM 조작은 본질적으로 브라우저 전용. headless에서 Field는 FieldRegistry만으로 충분히 테스트되므로, T5/T6은 "nice to have"일 수 있음
