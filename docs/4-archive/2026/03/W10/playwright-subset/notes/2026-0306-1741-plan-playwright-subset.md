# Plan: Playwright Strict Subset API

> 생성일: 2026-03-06 17:41
> 트리거: /discussion → Clear → /plan

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `types.ts:Page` | `{ locator, keyboard: { press } }` — `type()` 없음 | `{ locator, keyboard: { press, type } }` — Playwright Page subset | Clear | — | tsc 0 | 없음 (추가만) |
| 2 | `types.ts:LocatorAssertions` | `toBeSelected, toBeExpanded, toBePressed, toBeEditing` 포함 | 제거. Playwright 공식에 없음 → `toHaveAttribute()`로 대체 | Clear | — | tsc 0 (소비자 에러 허용) | `expect.ts` + locator 구현체에서도 제거 필요 |
| 3 | `types.ts:Locator` | `click, getAttribute, inputValue` | 유지 (전부 Playwright에 있음) | Clear | — | — | 없음 |
| 4 | `scripts.ts:ExpectLocator` | `{ toHaveAttribute, toBeFocused, not }` | `types.ts`의 `LocatorAssertions`와 통일 (중복 제거) | Clear | →#2 | import 경로 변경 | 소비자 4곳 |
| 5 | `page.ts:AppPage` | `dispatch(), state, goto(), focusedItemId(), selection(), activeZoneId(), click(), attrs(), query(), html()` 포함 | `dispatch`, `state` 제거. 나머지는 `AppPageDebug` 별도 인터페이스로 분리 | Clear | →#1 | tsc 0 (소비자 에러 허용 — LLM 소급적용) | 소비자 5파일 |
| 6 | `os-sdk/types.ts:AppPage<S>` | `dispatch`, `state`, `goto` 등 전부 포함 | `dispatch`, `state` 제거. `goto`는 infra 전용으로 유지 | Clear | →#5 | tsc 0 | 소비자 동일 |
| 7 | `page.ts:locator()` | `toBeFocused()`, `toBeSelected()` 등을 locator 자체에 부착 | locator에서 assertion 메서드 제거 — assertion은 `expect(locator)` 전용 | Clear | →#2 | tsc 0 | `expect.ts` wrapper와 정합성 |

## MECE 점검

1. CE: #1~#7 실행하면 Page/Locator/LocatorAssertions가 Playwright strict subset 확정? → ✅
2. ME: 중복? → #4와 #2는 관련 있지만 별개 파일. 중복 아님
3. No-op: Before=After? → #3 (Locator 유지) → 제거

## 라우팅

승인 후 → `/go` (기존 프로젝트: `testing/playwright-subset`) — T1~T3
