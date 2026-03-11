# hmr-activity — Agent Activity HMR 전환

> **Claim**: full-reload → HMR custom event로 교체하면 페이지 상태 보존 + 실시간 갱신 달성
> **Scale**: Meta (Vite plugin + React state, headless 불필요)
> **Status**: ✅ Complete

## Done

- [x] T1 — Plugin: full-reload → custom event (fresh entries 전송) — tsc 0 | lint 0 ✅
- [x] T2 — Client: HMR event 수신 → React state 갱신 — tsc 0 | lint 0 ✅

## Verify

- tsc: 0 errors
- biome: 0 errors (1 pre-existing warning)
