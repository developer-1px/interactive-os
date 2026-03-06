# test-cleanup — pre-existing 테스트 실패 정리

## Context

누적된 리팩토링으로 테스트가 깨진 상태. 현재 11 files / 57 tests FAIL.
규모: **Meta** (테스트 코드만 수정)

Root Cause 분석 (2026-03-06 /discussion):

| RC | Root Cause | Files | Tests | 비중 |
|----|-----------|-------|-------|------|
| RC1 | 커널 싱글톤 격리 실패 — beforeEach에서 kernel+ZoneRegistry 리셋 안 됨 | 6 | 47 | 82% |
| RC2 | overlay/trigger 배선 — TriggerOverlayRegistry headless 동작 안 함 | 2 | 3 | 5% |
| RC3 | aria-current 프로젝션 경로 변경 — builder sidebar locator 검증 실패 | 1 | 2 | 4% |
| RC4 | selection 정렬 순서 — Shift+Up range 결과 순서 불일치 | 1 | 1 | 2% |

## Now

(all done)

## Done

- [x] T1: RC1 해소 — tsc 0 | 1911 pass, 0 fail ✅
  - preview layer isolation (`os.exitPreview()` at createAppPage start)
  - todo app: multi-select config + Space→OS_CHECK inputmap
  - Cmd+D: cursor-aware keybinding in collectionBindings()
- [x] T2: RC2 해소 — tsc 0 | 1911 pass, 0 fail ✅
  - simulateClick: item callback check before zone resolution
- [x] T3: RC3 해소 — already passing (builder-e2e-headless) ✅
- [x] T4: RC4 해소 — tsc 0 | 1911 pass, 0 fail ✅
  - selection() sorted by zone item list order in page.ts + createOsPage.ts
- [x] T5: docs-testbot §2b/§2e — zone-config context singleton race ✅
  - createOsPage zone-config reads from ZoneRegistry (not closure mockConfig)
  - setConfig() syncs to ZoneRegistry entry
- [x] T6: headless-item-discovery T3 — getZoneItems export ✅
  - Added getZoneItems wrapper delegating to ZoneRegistry.resolveItems
- [x] WP1-4: obsolete test file deletion ✅
- Evidence: 178 files / 1911 tests PASS | 0 fail | 2 todo

## Unresolved

## Ideas
