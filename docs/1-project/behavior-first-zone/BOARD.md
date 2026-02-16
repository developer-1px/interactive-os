# BOARD — behavior-first-zone

## 🔴 Now
- [ ] rolePreset 감사 — SHOULD→MUST 격상된 기본값을 식별하고 opt-in으로 변경
  - ref: discussions/2026-0216-2036-aria-role-vs-behavior.md
- [ ] Behavior primitive 정의 — 독립적 행동 단위 모듈 설계
- [ ] zone.bind() API 재설계 — `aria` + behavior 직접 선언 지원
- [ ] Role preset 재구성 — behavior 조합의 별명으로 전환
- [ ] 기존 zone binding 마이그레이션 — Todo, Builder, Playground

## ⏳ Done
- [x] Todo typeahead 비활성화 — options override로 임시 수정 (02-16)
- [x] Discussion 완료 — 아키텍처 방향 확정 (02-16)

## 💡 Ideas
- behavior composition helper (spread 기반 vs. array 기반)
- role preset을 "suggested preset"으로 리브랜딩 (문서/DX)
- LLM 가이드라인 — zone 설정 시 "어떤 행동이 필요한가?"를 먼저 묻도록 규칙화
- model/appState.ts의 중복 HistoryEntry를 OS에서 import하도록 통합
