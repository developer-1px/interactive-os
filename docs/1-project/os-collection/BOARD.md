# BOARD — OS Collection

> Project: os-collection
> Scale: Heavy
> Preset: Heavy (full cycle)

## 🔴 Now

- [ ] T1: `produceWithPatches` 도입
  - [ ] Step 3: /prd ✅
  - [ ] Step 9: /solve — Immer `enablePatches()` + history middleware 전환
  - [ ] Step 15: /verify

## ✅ Done

- [x] T0: Discussion + PRD 확정
  - [x] RFC 6902/6901 표준 채택
  - [x] OS = 프론트엔드 JSON DB 결론
  - [x] read/write lens = 앱의 유일한 선언
  - [x] OS가 커맨드를 생성 (createCollectionZone 승격)

## 💡 Ideas

- T2: createCollectionZone에 read/write lens 내부 전환
- T3: OS 레벨 collection API 노출
- T4: Todo 마이그레이션 — 앱 CRUD 커맨드 제거
- T5: Builder/Kanban 마이그레이션 — nested 검증
