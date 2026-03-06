# /plan — test-page-unification (v2, /divide 반영)

## 핵심 진단

createOsPage의 setter는 bind가 없던 시절의 유산이다. 지금은 defineApp+bind가 같은 일을 선언형으로 한다.

- bind gap: 0 — 모든 setter가 bind 또는 기존 메커니즘으로 커버됨
- 남은 setter(setRects, setZoneOrder, initZone)는 "DOM이 공짜로 주는 것"의 headless 시뮬레이션
- 동적 변경(mid-test mutation)은 클로저 변수로 해결

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | tests/apg/*.test.ts (25 files) | `createOsPage()` + `goto({ items, role, config })` + `setItems/setConfig/setActiveZone` | `defineApp("test", {})` + `zone.bind({ role, getItems, options })` + `createPage(app)` + `goto("zone")`. 동적 변경은 클로저 변수 | Clear | — | 기존 tests 전량 PASS | 25 files, ~200 occurrences |
| 2 | tests/integration/os/*.test.ts (3 files) | `createOsPage()` + `initZone` + `setZoneOrder` | `defineApp` + 다중 zone.bind + 다중 goto. parentId는 goto options 확장 | Clear | — | 기존 tests 전량 PASS | initZone 11회, setZoneOrder 6회 |
| 3 | tests/integration/todo/*.test.ts + tests/e2e/*.test.ts (3 files) | `createOsPage()` | `defineApp` + `zone.bind` + `createPage` | Clear | — | 기존 tests PASS | 소규모 |
| 4 | 13 files: `page.OS_FOCUS(...)` 등 14개 직접 노출 | `page.OS_FOCUS(id)` | `import { OS_FOCUS } from "@os-core/4-command/focus/focus"; page.dispatch(OS_FOCUS(id))` | Clear | — | tsc 0 + tests PASS | 40 occurrences |
| 5 | createOsPage.ts + OsPage interface | 637줄 파일, 164줄 인터페이스 | 삭제. re-export 제거 (`page.ts:53-58`) | Clear | #1~#4 | tsc 0, 0 import 잔여 | 전 파일 마이그레이션 완료 후 |
| 6 | setGrid (dead code) | OsPage.setGrid — 0회 사용 | 즉시 삭제 | Clear | — | tsc 0 | 없음 |

## 핵심 수치

- createOsPage 소비자: 40+ test files
- 핵심 setter 3개(setItems+setConfig+setActiveZone): ~280회 → 클로저 변수
- OS 커맨드 직접 노출: 40회 → import+dispatch
- DOM 시뮬레이션 setter(setRects 2, setZoneOrder 6, initZone 11): goto 흡수
- setGrid: 0회 → 삭제

## 라우팅

승인 후 → /go (test-page-unification) — T1(PoC) → T2(APG 벌크) → T3(integration/e2e) → T4(커맨드 전환) → T5(삭제) → T6(dead code)
