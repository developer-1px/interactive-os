# BOARD — sentinel-removal

## 🔴 Now

### 전체 진행: OS_FOCUS → ZoneCursor 전환
  - [x] Step 1: /ready
  - [x] Step 2: /discussion (이전 세션)
  - [x] Step 3: /prd
  - [x] Step 4: /redteam
  - [x] Step 5: /tdd — zone-cursor.test.ts 작성
  - [x] Step 6: /solve — T1~T5 구현 완료
  - [ ] Step 7: /review     ← 다음 재개 지점
  - [ ] Step 8: /fix
  - [ ] Step 9: /doubt
  - [ ] Step 10: /cleanup
  - [ ] Step 11: /verify
  - [ ] Step 12: /changelog

### T1: ZoneCursor 타입 인프라 ✅
- [x] `ZoneCursor` 인터페이스 정의 (`zoneRegistry.ts`)
- [x] `ZoneCallback` 타입 정의
- [x] `ZoneEntry` 콜백 타입 전환
- [x] `ZoneBindings` (defineApp.types.ts) 타입 전환
- [x] `KeybindingEntry.command` 타입 전환
- [x] `Zone.tsx`, `FocusGroup.tsx` props 타입 전환
- [x] `KeyBinding` (keybindings.ts) command 타입 전환

### T2: OS 커맨드 전환 ✅
- [x] `buildZoneCursor` 헬퍼 생성
- [x] `delete.ts` — multi loop 제거, callback(cursor) 한 번
- [x] `activate.ts` — callback(cursor) 전환
- [x] `check.ts` — callback(cursor) 전환
- [x] `move.ts` — callback(cursor) 전환
- [x] `clipboard.ts` — copy/cut/paste 전환
- [ ] `resolveFocusId.ts` 삭제 (cleanup 단계)

### T3: Keybinding 경로 ✅
- [x] `resolveKeyboard.ts` — `dispatch-callback` 결과 타입 추가
- [x] `KeyboardListener.tsx` — callback cursor 구성
- [x] `macFallbackMiddleware.ts` — callback 분기

### T4: 앱 전환 ✅
- [x] `todo/app.ts` — OS_FOCUS → cursor callbacks
- [x] `builder/app.ts` — N/A (OS_FOCUS 미사용)
- [ ] `sentinels.ts` OS_FOCUS 삭제 (cleanup 단계)

### T5: 테스트 업데이트 ✅
- [x] `zone-cursor.test.ts` — 8/8 pass (NEW)
- [x] `os-commands.test.ts` — 14/14 pass
- [x] `clipboard-commands.test.ts` — 3/3 pass
- [x] `multi-select-commands.test.ts` — 6/6 pass

### T6: 검증 (partial)
- [x] `tsc --noEmit` — 0 errors
- [x] `vitest run` — 722/753 pass (31 failures = builder-sections 기존 이슈)
- [ ] E2E 확인

## ⏳ Done
- [x] 초기 분석 — OS_FOCUS 센티널 필요성 검토 (2026-02-19)
- [x] per-item `(focusId: string)` 방식 시도 → ZoneCursor로 승격 (2026-02-19)

## 💡 Ideas
- `ZoneCursor` future extension (grid, tree, drag)
- Transaction 관리 앱 위임 시 `beginTransaction` API 노출 검토
