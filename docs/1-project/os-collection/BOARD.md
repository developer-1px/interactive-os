# BOARD — OS Collection

> Project: os-collection
> Scale: Heavy
> Preset: Heavy (full cycle)

## 🔴 Now

- [ ] T3: OS 레벨 collection API 노출
  - [ ] `createCollectionZone`의 커맨드들을 OS scope로 승격
  - [ ] 앱이 `os.collection({ read, write, create })` 한 줄로 전체 CRUD 얻기
  - [ ] Todo에서 검증

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
- [x] T2: createCollectionZone lens 검토
  - [x] fromEntities의 accessor는 이미 read/write lens 역할 수행
  - [x] Immer draft 위에서 accessor가 동작 → write-back 내장
  - [x] 추가 작업 불필요 (이미 달성)

## 💡 Ideas

- T4: Todo 마이그레이션 — 앱 CRUD 커맨드 제거
- T5: Builder/Kanban 마이그레이션 — nested 검증
