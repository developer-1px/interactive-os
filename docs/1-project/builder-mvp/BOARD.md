# BOARD — builder-mvp

## 🔴 Now

- [ ] T1: createZone + bind 마이그레이션 — `createWidget` → `createZone` + `zone.command` + `zone.bind`
  - ref: prd.md §1.1
  - [ ] /tdd
  - [ ] /divide
  - [ ] /verify
- [ ] T2: 캔버스 인라인 편집 — Enter 진입, 텍스트 수정, Enter/Escape 저장/취소
  - ref: prd.md §1.2
  - [ ] /tdd
  - [ ] /divide
  - [ ] /verify
- [ ] T3: 패널 양방향 동기화 — 실제 데이터 바인딩 (mock → BuilderApp.useComputed)
  - ref: prd.md §1.3
  - [ ] /tdd
  - [ ] /divide
  - [ ] /verify

## ⏳ Done

_(empty)_

## 💡 Ideas

- Undo/Redo (history middleware) 연동 — Todo에서 검증 완료, Builder에도 적용
- 블록 추가/삭제/정렬 커맨드
- 블록 타입별 Zone 분리 (tab으로 블록 간 이동)
- 개밥먹기 보고서를 기반으로 defineApp API v6 설계
