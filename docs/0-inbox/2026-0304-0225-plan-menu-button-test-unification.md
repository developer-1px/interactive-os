# Menu Button 테스트 통합 — 변환 명세표

> **트리거**: /discussion Clear → defineApp화 + 테스트 중복 제거
> **원칙**: 오컴의 면도날 — 하나의 TestScript가 headless/browser/e2e 3환경에서 실행

---

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `MenuButtonPattern.tsx`: 컴포넌트 | `Trigger` + `Trigger.Popover` 직접 사용. `defineApp` 없음 | `defineApp("apg-menu-button")` + `createZone` + `zone.bind({ role: "menu" })`. Trigger는 내부에서 유지 | Clear | — | tsc 0, 브라우저 렌더 동일 | MenuButtonPattern 소비자(`apg-showcase/index.tsx`) import 변경 없음 확인 |
| 2 | `menu-button.ts`: TestBot 스크립트 | 풀스펙 TestBot 스크립트 (이미 강화 완료) | 변경 없음. 유일한 스펙 소스 유지 | Clear | — | — | — |
| 3 | `menu-button.apg.test.ts`: headless test | `createOsPage()` + 수동 zone 구축 + 별도 assertion 225줄 | TestBot 스크립트를 import하여 `createPage(MenuButtonApp)` 기반 vitest wrapper로 교체. ~15줄 | Clear | →#1 | `vitest run tests/apg/menu-button.apg.test.ts` PASS | 기존 helpers/contracts 사용 중단 (menu-button만. 다른 패턴은 미변경) |

## MECE 점검

1. **CE**: 3행 모두 실행하면 목표(하나의 스크립트, 3환경 실행) 달성? → ✅
2. **ME**: 중복 행? → ❌ (없음)
3. **No-op**: Before=After? → #2가 변경 없음이지만 "유지 확인" 의미이므로 유효

## 라우팅

승인 후 → `/go` (이슈: menu-button 테스트 통합) — defineApp 리팩토링 + vitest wrapper 교체
