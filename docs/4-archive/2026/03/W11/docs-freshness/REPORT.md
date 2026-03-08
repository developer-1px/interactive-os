# /divide Report — 지식/공식문서 최신화

## Problem Frame

| | 내용 |
|---|------|
| **Objective** | 에이전트가 읽는 지식(.agent/knowledge/, docs/official/)을 코드 현실과 일치시키고, 분산된 문서를 통합하여 드리프트 재발을 구조적으로 줄인다 |
| **Constraints** | C1. 코드 변경 없음 (문서만) / C2. rules.md 참조 경로가 깨지면 안됨 / C3. working-standards #11 "복제본 동기화 금지" 준수 |
| **Variables** | V1. ZIFT canonical 위치 = zift-spec.md / V2. 2-area 해소 = references/ 삭제, praxis 유지 |

## Backward Chain

| Depth | Subgoal | 판정 | Evidence |
|-------|---------|------|----------|
| 0 | 지식·공식문서를 코드 현실과 일치 | --- | --- |
| 1 | A. State Shape 드리프트 수정 | --- | SPEC.md:43-44 `selection[]`, OSState.ts:102 `items: Record` |
| 1 | B. ZIFT 문서 통합 | --- | 5곳 분산 (working-standards #11 위반) |
| 1 | C. 경로 드리프트 수정 | --- | knowledge/ 6건, official/ 12건+ src/os/ 참조 |
| 1 | D. 2-area 중복 정리 | --- | praxis/ref-* 7건 = references/ref-* 7건 |
| 1 | E. design-principles 환류 | --- | 원칙 22-36 official 미반영 |
| 1 | F. 참조 무결성 검증 | --- | rules.md 참조 테이블 → 최종 검증 |

## Work Packages

| WP | Subgoal | Chain | Files |
|----|---------|-------|-------|
| 1 | SPEC.md 전면 갱신 | Goal <- A | docs/official/os/SPEC.md |
| 2 | domain-glossary.md 갱신 | Goal <- A, C | .agent/knowledge/domain-glossary.md |
| 3 | ZIFT 3문서 -> 1 통합 | Goal <- B | zift-spec.md, zift-overview.md, zift-detail.md, zone-data-model.md |
| 4 | knowledge 경로 갱신 | Goal <- C | folder-structure.md, audit.md, runbook.md, contract-checklist.md |
| 5 | official/os 경로 갱신 | Goal <- C | philosophy-overview.md, commands-architecture.md, focus-overview.md, field-key-ownership.md, lint-rules.md |
| 6 | 2-area 중복 정리 | Goal <- D | docs/2-area/references/ref-*.md 7건 삭제 |
| 7 | design-principles 환류 | Goal <- E | TBD |
| 8 | rules.md 참조 검증 | Goal <- F | .agent/rules.md |

## Execution Order

Phase 1 (parallel): WP1 + WP2 + WP6
Phase 2: WP3
Phase 3 (parallel): WP4 + WP5
Phase 4: WP7
Phase 5: WP8

## Residual Uncertainty

- WP7: 원칙 22-36 중 어느 것이 official 수준인지 판단 필요 (설계 판단)
- WP3 작업 중 추가 드리프트 발견 가능 (F 슬롯)
