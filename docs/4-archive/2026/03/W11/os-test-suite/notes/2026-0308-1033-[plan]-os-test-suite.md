# Plan: OS Test Suite Showcase

> OS pipeline 인터랙션 체인을 end-to-end로 exercise하는 showcase + headless test suite

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `src/routes/_minimal/playground.os-test.tsx` | 없음 | base route, staticData, FlaskConical icon, order:8 | Clear | -- | 라우트 접근 가능 | -- |
| 2 | `src/routes/_minimal/playground.os-test.$pattern.tsx` | 없음 | dynamic route | Clear | ->1 | $pattern 파라미터 동작 | -- |
| 3 | `src/pages/os-test-suite/index.tsx` | 없음 | sidebar + pattern render (layer-showcase 패턴 복제) | Clear | ->1,2 | 페이지 렌더링 | -- |
| 4 | `src/pages/os-test-suite/patterns/ClickFocusPattern.tsx` | 없음 | defineApp + 단일 zone + items. click->focus chain exercise | Clear | ->3 | headless test | -- |
| 5 | `src/pages/os-test-suite/patterns/CrossZonePattern.tsx` | 없음 | defineApp + 2 zones. zone간 focus transfer exercise | Clear | ->3 | headless test | OG-018 hit 가능 |
| 6 | `src/pages/os-test-suite/patterns/FieldLifecyclePattern.tsx` | 없음 | defineApp + field zones. trigger:"change" vs "enter" | Clear | ->3 | headless test | OG-013 hit 가능 |
| 7 | `tests/headless/apps/os-test-suite/click-focus.test.ts` | 없음 | headless test for #4 | Clear | ->4 | vitest pass | -- |
| 8 | `tests/headless/apps/os-test-suite/cross-zone.test.ts` | 없음 | headless test for #5 | Clear | ->5 | vitest pass (or .todo for gaps) | -- |
| 9 | `tests/headless/apps/os-test-suite/field-lifecycle.test.ts` | 없음 | headless test for #6 | Clear | ->6 | vitest pass (or .todo for gaps) | -- |

## 라우팅
승인 후 -> /project (새 프로젝트: testing/os-test-suite) -> /go 직접 실행 (Meta 프로젝트)
