# eliminate-createOsPage

> `createOsPage` 삭제. 모든 OS 테스트를 Zone→Input→ARIA 패턴으로 통합.

**Type**: Meta (Red/Green 스킵, 직접 실행)

## Done

- [x] #1 goto() 옵션 확장 + page.os escape hatch 제거 + 3파일 마이그레이션 — tsc 0 | 35 tests GREEN ✅
- [x] #2 HeadlessPage에서 `get os` + OsPage import 제거 — tsc 0 ✅

## Now

- [ ] #3 os-core 커맨드 테스트 마이그레이션 (10파일)
- [ ] #4 tests/integration/os/ 마이그레이션 (3파일)
- [ ] #5 tests/apg/ 마이그레이션 (8파일)
- [ ] #6 tests/integration/builder/ 마이그레이션 (3파일)
- [ ] #7 tests/integration/docs+todo 마이그레이션 (6파일)
- [ ] #8 tests/script+e2e 마이그레이션 (5파일)

## Next

- [ ] #3 os-core 커맨드 테스트 마이그레이션 (10파일)
- [ ] #4 tests/integration/os/ 마이그레이션 (3파일)
- [ ] #5 tests/apg/ 마이그레이션 (8파일)
- [ ] #6 tests/integration/builder/ 마이그레이션 (3파일)
- [ ] #7 tests/integration/docs+todo 마이그레이션 (6파일)
- [ ] #8 tests/script+e2e 마이그레이션 (5파일)

## Later

- [ ] #9 createOsPage.ts 삭제
- [ ] #10 page.ts export 정리
