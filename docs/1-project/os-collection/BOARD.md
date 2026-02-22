# BOARD — OS Collection

> Project: os-collection
> Scale: Heavy
> Preset: Heavy (full cycle)

## 🔴 Now

(없음 — 다음 세션에서 T4 시작)

## ✅ Done

- [x] T0: Discussion + PRD 확정
  - [x] RFC 6902/6901 표준 채택
  - [x] OS = 프론트엔드 JSON DB 결론
  - [x] read/write lens = 앱의 유일한 선언
  - [x] OS가 커맨드를 생성 (createCollectionZone 승격)
- [x] T1: produceWithPatches 도입
  - [x] Immer enablePatches() 활성화
  - [x] HistoryEntry에 patches/inversePatches 필드 추가
  - [x] history middleware에서 produceWithPatches 사용
  - [x] 905 tests 전부 통과
- [x] T2: lens 검토 (fromEntities accessor 이미 lens 역할. skip)
- [x] T3: OS 레벨 collection 적용 확대
  - [x] sidebar → createCollectionZone 전환 (-39줄)
  - [x] moveCategoryUp/Down 수동 커맨드 자동 생성으로 대체
  - [x] 905 tests 전부 통과

## 💡 Ideas

- T4: os.collection() API — 앱이 read/write/create 한 줄로 전체 CRUD 얻기
- T5: Todo 마이그레이션 — confirmDeleteTodo/clearCompleted 보일러플레이트 제거
- T6: Builder/Kanban 마이그레이션 — nested 검증
- T7: Snapshot 필드 제거 → patch-only undo
