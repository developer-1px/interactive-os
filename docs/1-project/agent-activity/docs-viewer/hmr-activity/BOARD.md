# hmr-activity — Agent Activity HMR 전환 + 파일 접근

> **Claim**: full-reload → HMR custom event + middleware file API로 실시간 갱신 + 모든 파일 접근
> **Scale**: Meta (Vite plugin + React, headless 불필요)
> **Status**: ✅ Complete

## Done

- [x] T1 — Plugin: full-reload → custom event (fresh entries 전송) — tsc 0 | lint 0 ✅
- [x] T2 — Client: HMR event 수신 → React state 갱신 — tsc 0 | lint 0 ✅
- [x] T3 — Plugin: `/api/file` middleware 추가 (fs.readFile, 프로젝트 루트 내 제한) — tsc 0 | lint 0 ✅
- [x] T4 — Client: fetchProjectFile → /api/file 호출 + isProjectFile `.md` 제한 제거 — tsc 0 | lint 0 ✅

## Verify

- tsc: 0 errors
- biome: 0 errors (pre-existing warnings only)
