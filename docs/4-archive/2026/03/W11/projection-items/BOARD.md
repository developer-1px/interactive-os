# projection-items

## Context

Claim: projection mode에서 renderToString → HTML parse → `[data-item]` 추출이 getItems의 truth여야 한다. 현재 getItems(L0)와 React 조건부 렌더링(L2)이 독립된 두 진실원천이라 headless/browser 괴리(Zero Drift 위반)가 발생한다.

Before → After:
- **Before**: headless `dom-items` context가 `ZoneRegistry.getItems()` (앱이 하드코딩한 목록)에 의존. React가 조건부로 렌더링하지 않는 Item도 "존재"로 판단 → Tab/ArrowKey가 유령 아이템으로 이동
- **After**: Component 있는 projection mode에서 `renderToString → jsdom parse → querySelectorAll("[data-item]")` 결과를 ZoneRegistry의 getItems에 주입. binding-provided getItems가 있는 zone은 보존, 없는 zone만 projection 적용

Design: projection은 getItems를 **대체**하지 않고 **공급**한다. Browser의 DOM scan이 getItems를 공급하듯, headless의 renderToString이 getItems를 공급. 동일 인터페이스, 다른 소스.

Evidence:
- `compute.ts:87` — `"data-item": true` attr이 Item에 항상 존재
- `zoneContext.ts:198` — `"data-zone": zoneId` attr이 Zone container에 항상 존재
- `page.ts:537-553` — renderToString + _htmlCache 인프라 이미 존재
- Inspector 관찰: docs-reader에서 ArrowLeft/Right 전부 Diff:None (browser에 item 없음)

## Now
(비어있음 — 전체 완료)

## Done
- [x] T1: parseProjectionItems() + syncProjectionToRegistry() 추가 — tsc 0 | +4 tests ✅
- [x] T2: dom-items context — getItems() 경유 (projection이 getItems에 주입) — tsc 0 ✅
- [x] T3: dom-zone-order context — getItems() 경유 — tsc 0 ✅
- [x] T4: assertElementInProjection DOM parse로 개선 — tsc 0 ✅
- [x] T5: regression 확인 — 729 pass, 26 fail(전부 pre-existing), 0 regression ✅

## Unresolved
- (해소됨: jsdom 환경에서 document.createElement + innerHTML 사용. 별도 의존성 불필요)

## Ideas
- browser 쪽 DOM_ITEMS도 DOM scan only로 통일 + getItems API deprecated (후속 프로젝트)
- binding-provided getItems도 점진적으로 제거하여 전체 projection-only로 전환
- DocsViewer headless test — `virtual:docs-meta` + `import.meta.glob` mock으로 실제 DocsViewer를 headless에서 테스트 (별도 프로젝트)
