# BOARD — OS Collection

> Project: os-collection
> Scale: Heavy
> Preset: Heavy (full cycle)

## 🔴 Now

- [ ] T2: createCollectionZone에 read/write lens 전환
  - [ ] fromEntities에 write 함수 추가
  - [ ] createCollectionZone 내부를 lens 기반으로 리팩토링
  - [ ] Todo 마이그레이션 테스트

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

## 💡 Ideas

- T3: OS 레벨 collection API 노출
- T4: Todo 마이그레이션 — 앱 CRUD 커맨드 제거
- T5: Builder/Kanban 마이그레이션 — nested 검증
