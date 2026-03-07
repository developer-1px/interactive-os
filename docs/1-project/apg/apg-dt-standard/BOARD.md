# apg-dt-standard

## Context

Claim: `.apg.md` = W3C Example 충실 복사 + Decision Table(Given/When/Then) + Traffic Light. 이것이 APG 테스트 충분성의 유일한 보장 메커니즘이다.

Before → After:
- Compliance Matrix (N/E/S/A/R 카테고리, 1:1 매핑 미보장) → Decision Table (DT 행 = it() 1:1, Playwright 구문)
- 단일 파일 (tabs.apg.test.ts에 auto+manual 혼재) → Example별 분리 ({pattern}-{example}.apg.md)
- 스펙 텍스트만 근거 → Example 코드(JS)에서 암묵적 행동 발굴도 포함

Risks: Tabs 패턴 전환 시 TabsApp에 getItems bind 필요할 수 있음 (accordion 프로토타입에서 발견된 패턴)

### 태스크 실행 절차 (각 T에 동일 적용)

1. W3C APG 패턴 페이지 + Example 페이지를 WebFetch로 읽는다
2. 기존 `.apg.test.ts`를 읽어 현재 테스트 커버리지 파악
3. `{pattern}.apg.md` DT 작성 — W3C 원문 워딩 기반, 각 행 = it() 1:1
4. 기존 테스트와 DT 행 매핑 → Signal (green/uncovered/na) 부여
5. `vitest run tests/apg/{pattern}.apg.test.ts` 로 전수 통과 확인
6. `src/pages/apg-showcase/index.tsx` 해당 패턴 status를 `"dt"`로 변경
7. BOARD.md에서 해당 T를 Done으로 이동 + 결과 기록
8. 커밋

## Now

- [x] T8: button.apg.md — 20행 DT (18🟢, 2➖). Action+Toggle 양쪽 커버. 18 tests pass ✅
- [x] T9: switch.apg.md — 17행 DT (14🟢, 3➖). 12 tests pass ✅
- [x] T10: checkbox.apg.md — 12행 DT (7🟢, 1⬜, 4➖). 7 tests pass ✅
- [x] T11: disclosure.apg.md — 20행 DT (18🟢, 2➖). Tab flow + independent expand. 19 tests pass ✅
- [x] T12: radiogroup.apg.md — 22행 DT (18🟢, 4➖). followFocus + disallowEmpty + 4-axis arrow. 20 tests pass ✅
- [ ] T13: meter.apg.md — DT 표준 전환
- [ ] T14: tooltip.apg.md — DT 표준 전환
- [ ] T15: toolbar.apg.md — DT 표준 전환
- [ ] T16: menu.apg.md — DT 표준 전환
- [ ] T17: menu-button.apg.md — DT 표준 전환
- [ ] T18: tree.apg.md — DT 표준 전환
- [ ] T19: treegrid.apg.md — DT 표준 전환
- [ ] T20: carousel.apg.md — DT 표준 전환
- [ ] T21: feed.apg.md — DT 표준 전환
- [ ] T22: combobox.apg.md — DT 표준 전환
- [ ] T23: dialog.apg.md — DT 표준 전환
- [ ] T24: dropdown-menu.apg.md — DT 표준 전환
- [ ] T25: navtree.apg.md — DT 표준 전환

## Done

- [x] T1: accordion.apg.md 보강 — I1-I2, P1-P2, A1-A5 Signal+Test 추가. 24행 DT 완성
- [x] T2: accordion.apg.test.ts — +5 tests (18 total). 17 pass, 1 fail (I1: OS gap) ✅
- [x] T3: /apg 워크플로우 재작성 — .claude/commands + .agent/workflows 동기화. DT 기반, accordion 표준 참조 ✅
- [x] T4: tabs-auto.apg.md + tabs-auto.apg.test.ts — 15 tests (13 pass, 2 fail: I1+A5 OS gaps) + tabindex getAttribute fix ✅
- [x] T5: tabs-manual.apg.md + tabs-manual.apg.test.ts — 17 tests (15 pass, 2 fail: I1+A5 OS gaps) + TabsManualApp isolation ✅
- [x] T6: tabs.apg.test.ts 삭제 ✅
- [x] T7: listbox.apg.md — 40행 DT (34🟢, 2⬜, 4➖). W3C Scrollable+Rearrangeable 양쪽 참조. 40 tests pass ✅

## Unresolved

(all resolved — see `initial-state-aria-controls` project)

## Ideas
