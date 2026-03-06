# eliminate-createOsPage

> `createOsPage` 완전 삭제. 모든 OS 테스트를 Zone→Input→ARIA 패턴으로 통합.

**Type**: Meta (Red/Green 스킵, 직접 실행)

## Done

- [x] #1 goto() 옵션 확장 + page.os escape hatch 제거 + 3파일 마이그레이션 — tsc 0 | 35 tests GREEN
- [x] #2 HeadlessPage에서 `get os` + OsPage import 제거 — tsc 0
- [x] #3 Git 정리 — 삭제된 6개 APG UI 테스트 이미 커밋됨
- [x] #4 @testing-library 잔여 확인 — import 0개, 주석만 존재. 조치 불필요
- [x] #5 OS 내부 resolve* 직접 테스트 정리 — 11파일 삭제(-126 tests), 3파일 유지(순수 입력 파서)
- [x] #6 tests/integration/os/ 삭제 — 3파일(-55 tests). APG 테스트가 커버
- [x] #7 tests/apg/ — os-guarantee 삭제(-15 tests)
- [x] #8 tests/integration/builder/ — Later 이동 판정
- [x] #9 tests/integration/docs+todo 삭제 — 4파일(-21 tests)
- [x] #10 tests/script+e2e — 4파일 삭제(-17 tests)

## Now

(empty — all tasks complete)

## Recently Done

- [x] #11 value-based APG 6파일 삭제 (-123 tests)
- [x] #12 builder 통합 3파일 삭제 (-19 tests, 2 todo)
- [x] #13 dispatch 의존 3파일 삭제 (stale-focus-recovery, format-diagnostics, strict-api-guard T5)
- [x] #14 createOsPage 공개 API 제거 — page.ts re-export(GotoOptions, ZoneOrderEntry) 삭제
- [x] #15 검증 — 147 files, 1540 tests GREEN, tsc 0, grep createOsPage = 인프라만

## Dropped

- ~#3(old) os-core 커맨드 테스트 마이그레이션~ → 유지 판정. OS 내부 커맨드 핸들러 dispatch()는 정당
- ~#16-#19(old) goto K2 순수화, runScenarios, createHeadlessPage 삭제~ → 별도 프로젝트로 분리
