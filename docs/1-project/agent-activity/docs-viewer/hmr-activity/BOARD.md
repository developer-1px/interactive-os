# hmr-activity — Agent Activity HMR 전환 + 파일 접근

> **Claim**: full-reload → HMR custom event + middleware file API로 실시간 갱신 + 모든 파일 접근
> **Scale**: Meta (Vite plugin + React, headless 불필요)

## Now

- [ ] T3 — Plugin: `/api/file` middleware 추가 (fs.readFile, 프로젝트 루트 내 제한)
- [ ] T4 — Client: fetchProjectFile()을 /api/file 호출로 교체 + isProjectFile 제한 제거

## Done

- [x] T1 — Plugin: full-reload → custom event (fresh entries 전송) — tsc 0 | lint 0 ✅
- [x] T2 — Client: HMR event 수신 → React state 갱신 — tsc 0 | lint 0 ✅
