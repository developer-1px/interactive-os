# BOARD — OS Collection

> Project: os-collection
> Scale: Heavy
> Preset: Heavy (full cycle)

## 🔴 Now

(없음)

## ✅ Done

- [x] T0: Discussion + PRD 확정
- [x] T1: produceWithPatches 도입
- [x] T2: lens 검토 (이미 달성)
- [x] T3: sidebar → createCollectionZone (-39줄)
- [x] T4: removeFromDraft + OS vs App 경계 명시
- [x] T5: create 팩토리 + auto-generated add command (-17줄)
- [x] T7: patch-based undo/redo
  - [x] History middleware에서 data-level patches 수집
  - [x] defineApp.undoRedo에서 applyPatches 사용
  - [x] snapshot은 legacy fallback으로 유지
  - [x] 905 tests pass

## 📊 진행 지표

| 지표 | 시작 | 현재 | 변화 |
|------|------|------|------|
| app.ts 줄 수 | 514 | 481 | -33줄 |
| 수동 CRUD 커맨드 | 5 | 0 | 전부 자동 생성 |
| Undo 방식 | snapshot (full copy) | patches (diff only) | 메모리 효율 ↑ |

## 💡 Ideas (Backlog)

- T6: Builder/Kanban 마이그레이션 — nested 검증
- T8: snapshot 필드 완전 제거 (legacy fallback 삭제)
- T9: re-export 정리 (deleteTodo, moveItemUp 등)
