# BOARD — OS Hygiene

## 🔴 Now
(없음 — 모든 태스크 완료)

## ⏳ Done
- [x] T1: 4-effects dead export 정리 — FOCUS/SCROLL/FIELD_CLEAR_EFFECT 토큰 제거, defineEffect 호출 유지
- [x] T2: loopGuard dead export 정리 — dispatchGuard, activeZoneGuard 제거
- [x] T3: 레거시 스키마 전면 제거 — 10파일 삭제 + schemas/effect, schemas/logic 디렉토리 삭제
- [x] T4: schemas barrel 정리 — 68줄 → 47줄
- [x] T5: /verify — typecheck ✅ test 721/736 pass (15 fails = pre-existing)

## 💡 Ideas
- `useOS` hook을 inspector 쪽으로 이동 고려 (소비자 1건)
- history.test.ts + transaction.test.ts 실패 수정 (deleteTodo → OS_FOCUS에서 OS state 미초기화)
