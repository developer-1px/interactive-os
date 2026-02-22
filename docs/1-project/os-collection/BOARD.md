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
- [x] T5: create 팩토리 + auto-generated add command
  - [x] SharedCollectionConfig에 create 추가 (T | null 반환)
  - [x] createCollectionZone이 add 커맨드 자동 생성
  - [x] addTodo = listCollection.add! (-17줄)
  - [x] 905 tests pass

## 📊 진행 지표

| 지표 | 시작 | 현재 | 변화 |
|------|------|------|------|
| app.ts 줄 수 | 514 | 481 | -33줄 |
| produce() 횟수 | 14 | 13 | -1 |
| 수동 CRUD 커맨드 | 5 (add, delete, moveUp, moveDown, moveUp/Down sidebar) | 0 | -5 |

## 💡 Ideas

- T6: Builder/Kanban 마이그레이션 — nested 검증
- T7: Snapshot 필드 제거 → patch-only undo (applyPatches)
- T8: re-export 정리 (deleteTodo, moveItemUp 등 backward compat 제거)
