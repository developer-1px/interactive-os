# docs-freshness — 지식/공식문서 최신화

> 에이전트가 읽는 지식과 공식문서를 코드 현실과 일치시키고, 분산된 문서를 통합하여 드리프트 재발을 구조적으로 줄인다.

## Context

- SPEC.md, domain-glossary.md의 State Shape이 `items: Record<string, AriaItemState>` 마이그레이션을 반영하지 않음
- `src/os/` 경로가 `packages/os-core/src/`로 재구조화되었으나 문서 20건 이상이 구 경로 참조
- ZIFT 설명이 5곳에 분산 (zift-overview, zift-detail, zift-spec, domain-glossary, SPEC.md)
- docs/2-area에 praxis/ref-* vs references/ref-* 동일 이름 중복 7쌍

## Done

- [x] WP1: SPEC.md 전면 갱신 (State Shape → items map, Command, Component ARIA, 경로)
- [x] WP2: domain-glossary.md Zone 상태 구조 + 파이프라인 경로 갱신
- [x] WP3: ZIFT 3문서 → 1 canonical (zift-overview + zift-detail 삭제, zift-spec.md 유지)
- [x] WP4: .agent/knowledge/ 경로 일괄 갱신 (folder-structure, audit, runbook, contract-checklist)
- [x] WP5: docs/official/os/ 경로 일괄 갱신 (philosophy-overview, commands-architecture, focus-overview, field-key-ownership, lint-rules)
- [x] WP6: 2-area 중복 정리 (praxis/ref-* 7건 삭제, references/ canonical)
- [x] WP7: design-principles 환류 판단 → official 미반영 (구현 레벨 판단, knowledge 위치 적절). 22-36 중복(36) 삭제
- [x] WP8: rules.md 참조 무결성 검증 → 깨진 참조 0건

## Now

(완료)

## Backlog

(없음)
