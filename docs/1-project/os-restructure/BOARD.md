# os-restructure — Phase 2: tsx 로직 추출

## Context

tsx를 최대한 얇은 bypass 통로로 만든다. Zone.tsx/Item.tsx가 모범 사례.
규모: **Meta** (파일 이동 + 함수 추출, 새 기능 없음)

## Now
- [ ] #6-8: Field/QuickPick 유틸 함수 분리

## Done
- [x] #1: 5-effect → os-core 이동 ✅ (`packages/os-core/src/5-effect/` — index.ts 존재)
- [x] #2: 1-listen/*.ts 순수 파일 → os-core 이동 ✅ (`os-core/1-listen/` 하위: keyboard/, mouse/, pointer/, clipboard/)
- [x] #3: senseKeyboard() 추출 ✅ (`os-core/1-listen/keyboard/senseKeyboard.ts`)
- [x] #4: PointerListener 핸들러 로직 추출 ✅ (`os-core/1-listen/mouse/resolveClick.ts`, `resolveMouse.ts`)
- [x] #5: ClipboardListener sense 로직 추출 ✅ (`os-core/1-listen/clipboard/resolveClipboard.ts`)
- (Phase 1 완료: T1~T8, 패키지 물리 분리)
