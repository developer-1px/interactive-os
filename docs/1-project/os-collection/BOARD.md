# BOARD — OS Collection

> Project: os-collection
> Scale: Heavy
> Preset: Heavy (full cycle)

## 🔴 Now

- [ ] T1: `produceWithPatches` 도입 — history에 patches/inversePatches 저장
  - [ ] Immer `enablePatches()` 활성화
  - [ ] history middleware에서 `produceWithPatches` 사용
  - [ ] HistoryEntry에 `patches` / `inversePatches` 필드 추가
  - [ ] undo/redo를 `applyPatches`로 전환
  - [ ] 기존 snapshot 필드 유지 (하위 호환)
  - [ ] 테스트: bulk delete → 1회 undo → 전체 복원

## ✅ Done

- [x] T0: Discussion + PRD 확정
  - [x] RFC 6902/6901 표준 채택
  - [x] Immer inverse patches = undo 결정
  - [x] App Coverage Matrix 작성
  - [x] 점진적 마이그레이션 5-Phase 설계

## 💡 Ideas

- T2: Collection bind API — `collection: { entities, order, ... }` 옵션
- T3: Todo 마이그레이션 — `createCollectionZone` → `collection` bind
- T4: Builder 마이그레이션 — nested field editing 검증
- T5: Kanban 마이그레이션 — 2-depth nested collection 검증
- T6: Snapshot 필드 제거 — patch-only undo
