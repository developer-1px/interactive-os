# apg-dt-standard

## Context

Claim: `.apg.md` = W3C Example 충실 복사 + Decision Table(Given/When/Then) + Traffic Light. 이것이 APG 테스트 충분성의 유일한 보장 메커니즘이다.

Before → After:
- Compliance Matrix (N/E/S/A/R 카테고리, 1:1 매핑 미보장) → Decision Table (DT 행 = it() 1:1, Playwright 구문)
- 단일 파일 (tabs.apg.test.ts에 auto+manual 혼재) → Example별 분리 ({pattern}-{example}.apg.md)
- 스펙 텍스트만 근거 → Example 코드(JS)에서 암묵적 행동 발굴도 포함

Risks: Tabs 패턴 전환 시 TabsApp에 getItems bind 필요할 수 있음 (accordion 프로토타입에서 발견된 패턴)

## Now

- [x] T4: tabs-auto.apg.md + tabs-auto.apg.test.ts — 15 tests (13 pass, 2 fail: I1+A5 OS gaps) + tabindex getAttribute fix ✅
- [ ] T5: tabs-manual.apg.md + tabs-manual.apg.test.ts 생성
- [ ] T6: tabs.apg.test.ts 삭제

## Done

- [x] T1: accordion.apg.md 보강 — I1-I2, P1-P2, A1-A5 Signal+Test 추가. 24행 DT 완성
- [x] T2: accordion.apg.test.ts — +5 tests (18 total). 17 pass, 1 fail (I1: OS gap) ✅
- [x] T3: /apg 워크플로우 재작성 — .claude/commands + .agent/workflows 동기화. DT 기반, accordion 표준 참조 ✅

## Unresolved

- I1 OS gap: ExpandConfig/SelectConfig has no `initial` field → accordion first section not expanded, tabs first tab not selected on mount
- A5 OS gap: `aria-controls` only computed for expand mode items. Tablist uses select-based visibility → tab items missing `aria-controls` pointing to tabpanel

## Ideas
