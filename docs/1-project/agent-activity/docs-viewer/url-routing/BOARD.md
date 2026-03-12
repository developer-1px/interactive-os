# url-routing

| Key | Value |
|-----|-------|
| Claim | DocsViewer의 activePath를 URL hash와 양방향 동기화하면, 문서 공유/북마크/새로고침 복원이 가능해진다 |
| Before | `parseHashToPath()` + `getInitialPath()` 존재하지만 단방향(초기 로드만). selectDoc 해도 URL 안 바뀜. 새로고침 시 상태 소실 |
| After | selectDoc → hash 업데이트, hashchange → selectDoc. 양방향 동기화. 폴더 뷰도 URL 반영 |
| Size | Light |
| Risk | hashchange 이벤트와 selectDoc 간 무한 루프 가능 (guard 필요) |

## Now

- [x] T1: selectDoc 후 hash 업데이트 (state→URL) — S, 의존: —
- [x] T2: hashchange 이벤트 리스닝 (URL→state) — S, 의존: →T1
- [x] T3: goBack/goForward를 history.back()/forward()에 연결 — S, 의존: →T1

## Tasks

| # | Task | Before | After | AC | Status | Evidence |
|---|------|--------|-------|----|--------|----------|
| T1 | selectDoc 후 hash 업데이트 | selectDoc 시 URL 불변 | `selectDoc({id})` 후 `location.hash = "#/" + id` | tsc 0, +N tests | ✅ | tsc 0 ∣ +10 tests ∣ register.ts T1 subscribe |
| T2 | hashchange → selectDoc | 브라우저 뒤로가기/URL 직접 입력 시 반응 없음 | hashchange 이벤트 → `parseHashToPath` → `selectDoc` (무한루프 guard) | tsc 0, +N tests | ✅ | tsc 0 ∣ +10 tests ∣ register.ts T2 hashchange listener |
| T3 | goBack/goForward 연결 | 커맨드 선언만, noop | `goBack` → `history.back()`, `goForward` → `history.forward()` | tsc 0 | ✅ | tsc 0 ∣ register.ts T3 subscribe |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
