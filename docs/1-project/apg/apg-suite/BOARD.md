# BOARD — apg-suite

> 목표: Playwright 동형 테스트 아키텍처. setupZone(과도기) → goto(url) + App 자동 등록(최종).
> 선행 프로젝트: [apg-test-fidelity](../../../4-archive/2026/03/W10/apg-test-fidelity/BOARD.md), [apg-test-fix-18](../../../4-archive/2026/03/W10/apg-test-fix-18/BOARD.md)

## Baseline

- Before (2026-03-07 12:33): 22 files, 396 tests, **331 fail / 65 pass**
- After WP0 (2026-03-07 13:21): 22 files, 396 tests, **0 fail / 396 pass** + 전체 30 files 532 tests 0 fail

## 3-Stage Transition

| Stage | 내용 | 상태 |
|-------|------|------|
| 1. 환경 정비 | goto(zoneId) → setupZone(zoneId) 리네임 + 전수 치환 | Done |
| 2. App 표준화 | APG showcase 22개 패턴에 App export 추가 | 미착수 |
| 3. setupZone 제거 | setupZone 삭제, goto(url) + App mount → zone 자동 등록 | 미착수 |

---

## Now

- [ ] **WP1: APG showcase App export 표준화**
  - 7 patterns need App export: listbox, toolbar, menu, dialog, dropdown-menu, combobox, navtree
  - 나머지 15 patterns: App export 존재 확인 + testConfig 표준화
  - Success: 모든 22 showcase가 defineApp() 기반 App export

## Done

- [x] WP0: goto → setupZone 리네임 — API 4파일 + infra 3파일 + APG 22파일 + knowledge 2파일 전수 치환 — tsc 0 | 532 tests 0 fail ✅
  - Plan: `notes/2026-0307-1300-[plan]-goto-to-setupZone.md`
  - Unexpected: 리네임만으로 331 fail → 0 fail. 원인 미규명 (조사 필요)

## Unresolved

- **331 fail → 0 fail 원인**: 순수 리네임(goto→setupZone)이 왜 테스트를 고쳤는지 미규명. 가설: createOsPage의 goto가 basePage.goto를 경유하는 경로가 제거됨?
- WP1: 7개 showcase App export 미전환
- Stage 3: setupZone 제거 시점 — WP1 완료 후
