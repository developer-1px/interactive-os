# apg-suite

| Key | Value |
|-----|-------|
| Claim | Playwright 동형 테스트 아키텍처. setupZone(과도기) → goto(url) + App 자동 등록(최종) |
| Before | 22 files, 396 tests, 331 fail / 65 pass |
| After | WP0 완료: 22 files, 396 tests, 0 fail / 396 pass (전체 30 files 532 tests 0 fail) |
| Size | Heavy |
| Risk | 7개 showcase App export 미전환, setupZone 제거 시 WP1 완료 필요 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| WP0 | goto → setupZone 리네임 | API 4파일 + infra 3파일 + APG 22파일 전수 치환, tsc 0, 532 tests 0 fail | ✅ | basePage.goto 이중 등록 → os.setState 직접 호출 |
| WP1 | APG showcase App export 표준화 | 7 patterns App export + 15 patterns testConfig 표준화 | ⬜ | — |
| WP2 | setupZone 제거 + goto(url) 전환 | setupZone 삭제, goto(url) + App mount → zone 자동 등록 | ⬜ | WP1 완료 후 |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| U1 | 7개 showcase App export 미전환 (listbox, toolbar, menu, dialog, dropdown-menu, combobox, navtree) | WP1 블로커 |
| U2 | setupZone 제거 시점 — WP1 완료 후 | WP2 순서 의존 |
