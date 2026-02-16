# BOARD — behavior-first-zone

## 🔴 Now (Phase 2: Design)
- [ ] Behavior primitive 정의 — 독립적 행동 단위 모듈 설계
  - 📌 Open: spread-based vs array-based composition
  - 📌 Open: TypeScript 타입 설계 (generic? branded?)
- [ ] zone.bind() API 재설계 — `aria` + behavior 직접 선언 지원
  - 📌 Open: `role`을 유지하면서 `aria` 분리할지, `role` 의미만 변경할지
  - 📌 Open: 하위 호환성 보장 방법
- [ ] Role preset 재구성 — behavior 조합의 별명으로 전환
- [ ] 기존 zone binding 마이그레이션 — Todo, Builder, Playground

## ⏳ Done
- [x] Discussion 완료 — 아키텍처 방향 확정 (02-16)
- [x] PRD 작성 — Phase 1 AC 정의 (02-16)
- [x] Phase 1: rolePreset 감사 — typeahead opt-in 전환 (02-16)
  - listbox, tree에서 typeahead:true 제거
  - rolePresets.test.ts에 typeahead assertion 추가 (+16 tests)
  - Todo의 typeahead:false override 제거
  - 주석에 MUST vs SHOULD 구분 명시
  - 507→523 tests, tsc clean

## 💡 Ideas
- behavior composition helper (spread 기반 vs. array 기반)
- role preset을 "suggested preset"으로 리브랜딩 (문서/DX)
- LLM 가이드라인 — zone 설정 시 "어떤 행동이 필요한가?"를 먼저 묻도록 규칙화
- model/appState.ts의 중복 HistoryEntry를 OS에서 import하도록 통합
