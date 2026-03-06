# eliminate-createOsPage

> `createOsPage` 삭제 + 레거시 테스트 전수 정리. 모든 OS 테스트를 Zone→Input→ARIA 패턴으로 통합.

**Type**: Meta (Red/Green 스킵, 직접 실행)

## Done

- [x] #1 goto() 옵션 확장 + page.os escape hatch 제거 + 3파일 마이그레이션 — tsc 0 | 35 tests GREEN ✅
- [x] #2 HeadlessPage에서 `get os` + OsPage import 제거 — tsc 0 ✅

## Now

- [x] #3 Git 정리 — 삭제된 6개 APG UI 테스트 이미 커밋됨 ✅
- [x] #4 @testing-library 잔여 확인 — import 0개, 주석만 존재. 조치 불필요 ✅
- [x] #5 OS 내부 resolve* 직접 테스트 정리 — 11파일 삭제(-126 tests), 3파일 유지(순수 입력 파서) | 170 files 1809 tests ✅
- [x] #6 tests/integration/os/ 삭제 — navigate, focus, item-filter 3파일(-55 tests). APG 테스트가 커버 | 167 files 1754 tests ✅
- [x] #7 tests/apg/ — os-guarantee 삭제(-15 tests), 6 value-based APG는 Later 이동(OS core 미지원) | 166 files 1739 tests ✅
- [x] #8 tests/integration/builder/ — Later 이동. builderBlock headless 미지원(OS gap)으로 마이그레이션 불가
- [x] #9 tests/integration/docs+todo 삭제 — 4파일(-21 tests). testbot/APG 테스트가 커버 | 162 files 1718 tests ✅
- [x] #10 tests/script+e2e — 4파일 삭제(-17 tests, PoC/createOsPage전용), 2파일 Later 이동 | 158 files 1701 tests ✅

## Later

- [ ] #11 value-based APG 테스트 마이그레이션 (meter, slider, spinbutton, grid, window-splitter, slider-multithumb) — OS core value-based 패턴 API 지원 후
- [ ] #12 builder 통합 테스트 마이그레이션 (3파일) — builderBlock headless 지원 후
- [ ] #13 format-diagnostics + stale-focus-recovery 마이그레이션 (2파일) — createOsPage setup 대체 필요
- [ ] #14 createOsPage.ts 삭제 — #11~#13 완료 후
- [ ] #15 page.ts export 정리

## Dropped

- ~#3(old) os-core 커맨드 테스트 마이그레이션~ → 유지 판정. OS 내부 커맨드 핸들러 테스트에서 dispatch() 사용은 정당 (OS가 자기 커맨드를 단위 테스트하는 것은 Pipeline 우회가 아님)
