# 적응형 스킬 Description 재작성 + Eval — Skills 2.0 Auto-Trigger 활성화

> 작성일: 2026-03-12

## Summary

52개 스킬 중 **적응형 18개**의 description을 "무엇을 하는가" → "언제 호출되어야 하는가"로 재작성하고, Claude Code Skills 2.0의 eval 시스템으로 트리거 정확도를 측정·최적화한다.

## Why — 동기

현재 52개 스킬은 전부 사용자가 `/skillname`으로 수동 호출한다. Claude Code Skills 2.0의 auto-trigger(Claude가 맥락을 보고 스킬을 자동 제안)를 전혀 활용하지 않고 있다.

문제:
- `/go` 파이프라인 중 막혀도 사용자가 "어 여기서 `/why` 해야 하나? `/diagnose`?" 직접 판단해야 한다
- `/go`의 모호함 프로토콜이 `conflict → blueprint → divide` 3개로 하드코딩됨. 18개 적응형 도구 중 3개만 사용
- description이 한국어 1줄 요약이라 auto-trigger에 부적합 (트리거 조건이 아닌 기능 설명)

## What — 스킬 4종 분류

| 분류 | 개수 | auto-trigger | 예시 |
|------|------|-------------|------|
| **진입점** | 4 | ❌ 수동 유지 | /discussion, /go, /auto, /wip |
| **파이프라인 단계** | 12 | ❌ /go가 관리 | /plan, /red, /green, /verify, /archive |
| **적응형 도구** | 18 | ✅ **이 프로젝트 대상** | /why, /diagnose, /conflict, /blueprint, /naming |
| **인프라/유틸리티** | 17 | ❌ 독립 유틸 | /explain, /knowledge, /status, /mermaid |

## How — 접근

1. 적응형 18개 스킬의 SKILL.md description을 **트리거 조건 중심**으로 재작성
2. eval-set.json 작성 (상황 설명 → 기대 스킬, 20+ 케이스)
3. Skills 2.0 eval 실행 → 트리거 정확도 baseline 측정
4. description optimization loop → 최적 description 채택

## Prior Art

- **Claude Code Skills 2.0**: eval + benchmark + description optimization (Anthropic blog)
- **v1 → v2 scaffold 리팩토링 (2026-03-10)**: notes/ 제거, BOARD 테이블 포맷 도입
- **/wip 3사이클 (이번 세션)**: replay, agent-activity-feed, undo-scope-policy 숙성 — 스킬 품질 논의의 출발점

## Scope

**Phase 1 (이 프로젝트)**: description 재작성 + eval. 코드 변경 없음, SKILL.md frontmatter만 수정.

Phase 2 (/go 모호함 프로토콜 개방) 및 Phase 3 (모드 기반 /go 리디자인)은 Phase 1 결과 후 별도 프로젝트로 판단.
