# projection-items

## Context

Claim: projection mode에서 renderToString → HTML parse → `[data-item]` 추출이 getItems의 truth여야 한다. 현재 getItems(L0)와 React 조건부 렌더링(L2)이 독립된 두 진실원천이라 headless/browser 괴리(Zero Drift 위반)가 발생한다.

Before → After:
- **Before**: headless `dom-items` context가 `ZoneRegistry.getItems()` (앱이 하드코딩한 목록)에 의존. React가 조건부로 렌더링하지 않는 Item도 "존재"로 판단 → Tab/ArrowKey가 유령 아이템으로 이동
- **After**: Component가 있는 projection mode에서 `renderToString → happy-dom parse → querySelectorAll("[data-item]")` 결과가 items truth. `data-zone` attr로 zone별 분류. Component 없는 headless 테스트는 기존 getItems fallback 유지

Backing: Browser의 `3-inject/index.ts` DOM_ITEMS가 이미 `el.querySelectorAll("[data-item]")` + `el.closest("[data-zone]")` 패턴으로 items를 추출. 동일 패턴을 happy-dom에서 재현.

Evidence:
- `compute.ts:87` — `"data-item": true` attr이 Item에 항상 존재
- `zoneContext.ts:198` — `"data-zone": zoneId` attr이 Zone container에 항상 존재
- `page.ts:537-553` — renderToString + _htmlCache 인프라 이미 존재
- Inspector 관찰: docs-reader에서 ArrowLeft/Right 전부 Diff:None (browser에 item 없음)

Risks:
- happy-dom 의존성 추가 (이미 vitest가 사용하므로 실질적 위험 낮음)
- renderToString 호출 빈도 증가 가능 (캐시로 완화)
- 중첩 zone에서 item 귀속 오류 가능 (closest로 해결)

## Now
- [ ] T1: page.ts에 `parseProjectionItems()` 함수 추가 — 크기: S, 의존: —
- [ ] T2: `dom-items` context를 projection 결과로 교체 — 크기: S, 의존: →T1
- [ ] T3: `dom-zone-order` context를 projection 결과로 교체 — 크기: S, 의존: →T1
- [ ] T4: `assertElementInProjection` DOM parse로 개선 — 크기: S, 의존: →T1
- [ ] T5: regression 확인 + docs-viewer projection 테스트 추가 — 크기: M, 의존: →T2,T3

## Done

## Unresolved
- (해소됨: jsdom 환경에서 document.createElement + innerHTML 사용. 별도 의존성 불필요)

## Ideas
- projection 결과를 assertElementInProjection에도 활용 (현재 string includes → DOM query로 개선)
- getItems 자체를 deprecated하고 모든 zone이 projection-first로 전환
