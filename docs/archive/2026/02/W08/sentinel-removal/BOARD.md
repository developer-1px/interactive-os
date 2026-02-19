# BOARD — sentinel-removal

## ⏳ Done

### OS_FOCUS → ZoneCursor 전환 ✅
  - [x] Step 1: /ready
  - [x] Step 2: /discussion (이전 세션)
  - [x] Step 3: /prd
  - [x] Step 4: /redteam
  - [x] Step 5: /tdd — zone-cursor.test.ts 작성
  - [x] Step 6: /solve — T1~T5 구현 완료
  - [x] Step 7: /review — 1건 수정 (buildZoneCursor 중복 타입)
  - [x] Step 8: /fix — lazy 주석 1건 제거
  - [x] Step 9: /doubt — 3건 제거 (sentinels.ts, resolveFocusId.ts/test)
  - [x] Step 10: /cleanup — doubt에서 완료
  - [x] Step 11: /verify — tsc ✅, vitest ✅
  - [x] Step 12: /changelog — b20ebd5

### T1: ZoneCursor 타입 인프라 ✅
### T2: OS 커맨드 전환 ✅
### T3: Keybinding 경로 ✅
### T4: 앱 전환 (todo ✅, builder N/A) ✅
### T5: 테스트 업데이트 ✅
### T6: 검증 ✅

## 💡 Ideas
- `ZoneCursor` future extension (grid, tree, drag)
- Transaction 관리 앱 위임 시 `beginTransaction` API 노출 검토
