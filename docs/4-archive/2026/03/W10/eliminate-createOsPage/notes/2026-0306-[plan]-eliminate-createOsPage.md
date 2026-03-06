# Plan: createOsPage 제거

> Goal: `createOsPage` 삭제. 모든 OS 테스트를 Zone→Input→ARIA(`createHeadlessPage`) 패턴으로 통합.
> 근거: OS의 계약 = "Zone을 선언하면 행동을 보장한다". Zone 없이 OS 내부를 조립하는 createOsPage는 이 계약과 모순.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `createHeadlessPage.ts` : `goto()` | `GotoOptions = { items, role, config, focusedItemId, initial }` — treeLevels/expandableItems/rects 미지원 | `GotoOptions += { treeLevels, expandableItems, rects, onAction, onCheck, onDelete }` — createOsPage 셋업 기능 흡수 | Clear | — | 기존 HeadlessPage 테스트 10파일 GREEN 유지 | createAppPage.goto()도 동시 확장 필요 |
| 2 | `createHeadlessPage.ts` : 구조 | `createOsPage()` 감싸는 wrapper | `createAppPage(dummyApp)` 직결. `get os` escape hatch 제거 | Clear | →#1 | tsc 0 + 기존 테스트 GREEN | — |
| 3 | `packages/os-core/4-command/__tests__/` 10파일 | `os.dispatch(CMD)` + `os.getState()` 직접 호출 (selection, field, stack, clipboard, move, zone-cursor, virtualFocus, multi-select, overlay, undo-redo) | `createHeadlessPage()` → `goto()` → `keyboard.press()` → `locator().toHaveAttribute()` | Complicated | →#1 | 기존 테스트 수 유지 + GREEN | 일부 커맨드(overlay, stack, virtualFocus)의 키보드 도달 경로 탐색 필요 |
| 4 | `tests/integration/os/` 3파일 | `createOsPage` + `dispatch(OS_NAVIGATE/FOCUS/TAB)` + `focusedItemId()` | `createHeadlessPage()` + `keyboard.press()` + `locator().toBeFocused()` | Clear | →#1 | GREEN | — |
| 5 | `tests/apg/` 8파일 | `createOsPage` + `setItems/setRole/setConfig/setValueNow` + `attrs()` | `createHeadlessPage()` + `goto({ role, initial: { values } })` + `locator().toHaveAttribute()` | Complicated | →#1 | GREEN | slider/spinbutton/meter의 value 검증 경로 확인 필요 |
| 6 | `tests/integration/builder/` 3파일 | `createOsPage` + `dispatch(OS_FOCUS)` + `keyboard.press` 혼합 | `createHeadlessPage()` + `goto()` + `keyboard.press()` + `locator()` | Clear | →#1 | GREEN | — |
| 7 | `tests/integration/docs-viewer/` 3파일 + `tests/integration/todo/` 3파일 | `createOsPage` + `kernel.dispatch` + `keyboard.press` 혼합 | `createHeadlessPage()` 또는 `createPage(app)` + K2 API | Clear | →#1 | GREEN | dialog-focus-trap은 overlay 커맨드 의존 — #3과 동일 패턴 |
| 8 | `tests/script/devtool/` 3파일 + `tests/e2e/` 2파일 | `createOsPage` + escape hatch 혼합 | `createHeadlessPage()` + K2 API. os-page.test.ts는 삭제 (createOsPage API 테스트) | Clear | →#1 | GREEN | os-page.test.ts 삭제로 커버리지 갭 없는지 확인 |
| 9 | `createOsPage.ts` (630줄) | 존재 | 삭제 | Clear | →#2~#8 전부 | tsc 0 + 전체 테스트 GREEN | 소비자 0 확인 후 삭제 |
| 10 | `page.ts` : export 정리 | `export { createOsPage, type OsPage, type OsLocator }` re-export | 해당 export 제거 | Clear | →#9 | tsc 0 | — |

## MECE 점검

1. CE: #1~#10 실행 시 createOsPage 완전 제거 + 모든 테스트 마이그레이션 → 목표 달성
2. ME: 각 행은 서로 다른 파일군 → 중복 없음
3. No-op: 없음

## 실행 순서

```
#1 (goto 확장) → #2 (HeadlessPage 직결)
  ↓
#3 ∥ #4 ∥ #5 ∥ #6 ∥ #7 ∥ #8  (마이그레이션 — 병렬 가능)
  ↓
#9 (createOsPage.ts 삭제) → #10 (export 정리)
```

## 라우팅

승인 후 → `/project` (testing/eliminate-createOsPage) — Meta 프로젝트, 테스트 인프라 리팩토링
