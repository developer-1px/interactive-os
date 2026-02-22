# BOARD — OS Collection

> Project: os-collection
> Scale: Heavy
> Preset: Heavy (full cycle)

## 🔴 Now

(없음)

## ✅ Done

- [x] T0: Discussion + PRD 확정
- [x] T1: produceWithPatches 도입 (enablePatches + HistoryEntry patches 필드)
- [x] T2: lens 검토 (이미 달성)
- [x] T3: sidebar → createCollectionZone (-39줄)
- [x] T4: removeFromDraft + OS vs App 경계 명시
  - [x] CollectionZoneHandle에 removeFromDraft 추가
  - [x] confirmDeleteTodo/clearCompleted의 수동 delete/splice 제거
  - [x] PRD에 OS(연산) vs App(워크플로우) 경계 문서화
  - [x] 905 tests pass

## 💡 Ideas

- T5: os.collection() 최종 API — read/write/create 한 줄로 전체 CRUD
- T6: Builder/Kanban 마이그레이션 — nested 검증
- T7: Snapshot 필드 제거 → patch-only undo
