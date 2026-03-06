# TestBot Real IDs — goto() 재정의 + fixture ID 제거

> **Goal**: `goto(route)` → history push → zone 활성화 → `getItems()` 순수 함수로 실제 ID 획득
> → testbot 스크립트가 실제 앱을 검증 → headless + browser 동일 결과 (ONE Format)
>
> **Type**: Meta (testing infrastructure)
> **Domain**: testing
> **Cynefin**: Complicated

## Problem

- headless `createOsPage.goto(zone, { items })` 가 가상 zone + 가짜 fixture ID 생성
- testbot 스크립트가 실제 앱에 존재하지 않는 ID (`sb-intro` 등)를 사용
- 결과: headless PASS + browser TestBot 전멸 (19/19 FAIL)
- ONE Format ("write once, run anywhere") 약속 위반

## Knowledge

- K1. `goto()` = 라우트 이동. zone/item setup은 앱 자체의 책임
- K2. `defineApp` ID 체계 (zone/item/trigger)가 진실의 원천. fixture ID는 존재하면 안 된다
- K3. `getItems()` 순수 함수로 실제 item ID 획득 — renderToString/JSX 불필요

## Now

(없음 — 모든 태스크 완료)

## Next

(없음)

## Done

- [x] T1: DocsViewer zone binding에 `getItems` 순수 함수 추가 — tsc 0 | +0 tests | 72 pass ✅
- [x] T3: Item discovery API — `TestScript.run(page, expect, items?)` 3rd param + `TestScenario.getItems` ✅
- [x] T4: testbot-docs.ts 재작성 — fixture ID 제거, `items` param으로 동적 발견 ✅
- [x] T5: testbot-builder-arrow.ts — `zone` 필드 추가 (실제 ID 사용 중이므로 rewrite 불필요) ✅
- [x] T6: `runScenarios` 업데이트 — `getItems()` 해석 + items를 `run()`에 전달 ✅
- [x] Browser `executeAll` — ZoneRegistry에서 items 해석하여 `run()`에 전달 ✅
- [x] `docs-tab.test.ts` — 제거된 fixture 상수 의존성 해소 (test-local constants) ✅
- [x] T7: 분석 완료 — `goto(items)` 는 50+ OS unit test에서 정당하게 사용 중. testbot fixture ID 문제는 T3-T6에서 해결됨. 제거 불필요 ✅

**Verification**: tsc 0 errors | 187 files | 1979 tests pass | 0 fail
