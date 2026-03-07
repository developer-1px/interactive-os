# Plan: APG Decision Table Standard

> Discussion Clear: `.apg.md` = W3C Example 충실 복사 + DT(Given/When/Then) + Traffic Light
> 프로젝트 성격: Meta (workflow 개선) + App (accordion/tabs 검증)

## Knowledge (Discussion 산출물)

- K1. APG DT는 3개 소스에서 행을 수집: (1) W3C 스펙 텍스트, (2) Example 코드 암묵적 행동, (3) ARIA 정적 속성
- K2. DT는 W3C Example 페이지의 표를 그대로 따른다. 카테고리 재발명 금지. 누락 검증 = 행 수 비교
- K3. Multi-example 패턴: `{pattern}-{example}.apg.md`로 분리. Example 간 DT를 섞지 않는다
- K4. Tab/Shift+Tab = 브라우저 기본 동작 (소극적 보장). 패턴 DT에서 N/A 처리

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 |
|---|------|--------|-------|---------|------|------|
| 1 | `tests/apg/accordion.apg.md` | K12/K13 = ⬜. ARIA A1-A5 기록만. 초기상태/패널동기화 없음 | K12/K13 → N/A. 초기상태(I1-I2) + 패널동기화(P1-P2) + ARIA(A1-A5) Signal+Test 추가 | Clear | — | DT 행 수 = W3C 행 수 + Example 암묵적 행동 수 |
| 2 | `tests/apg/accordion.apg.test.ts` | 13 tests (K+C+M only) | I1-I2, P1-P2, A1-A5 테스트 추가 | Clear | →#1 | vitest PASS |
| 3 | `.claude/commands/apg.md` | Compliance Matrix 기반. N/E/S/A/R/H 카테고리 | DT 기반 재작성. accordion = 표준 참조. `{pattern}-{example}.apg.md` 네이밍 | Clear | →#1,#2 | — |
| 4 | `.agent/workflows/apg.md` | #3의 복사본 | #3과 동기화 | Clear | →#3 | — |
| 5 | `tests/apg/tabs-auto.apg.md` | 없음 | W3C Tabs Auto example → DT + HTML/JS/CSS | Clear | →#3 | DT 행 수 일치 |
| 6 | `tests/apg/tabs-auto.apg.test.ts` | tabs.apg.test.ts auto 섹션 (setupZone) | Playwright-subset. createHeadlessPage + goto("/") | Clear | →#5 | vitest PASS |
| 7 | `tests/apg/tabs-manual.apg.md` | 없음 | W3C Tabs Manual example → DT + HTML/JS/CSS | Clear | →#3 | DT 행 수 일치 |
| 8 | `tests/apg/tabs-manual.apg.test.ts` | tabs.apg.test.ts manual 섹션 (setupZone) | Playwright-subset. createHeadlessPage + goto("/") | Clear | →#5 | vitest PASS |
| 9 | `tests/apg/tabs.apg.test.ts` | 303줄, auto+manual 혼재, setupZone | 삭제 (→ #6, #8로 분리) | Clear | →#6,#8 | regression 0 |

## 라우팅

승인 후 → `/project` (apg-dt-standard) — Meta + App 혼합. Accordion 표준화 → 워크플로우 업데이트 → Tabs 검증
