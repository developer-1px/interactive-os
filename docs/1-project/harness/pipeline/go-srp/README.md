# go-srp — /go 파이프라인 SRP 리팩토링

> `/go`를 순수 라우터로 슬림화하고, 각 스킬/에이전트가 자기 책임을 소유하게 만든다.

## Why

`/go`가 라우팅 외에 3가지 유형의 책임을 떠안고 있다:
- **구현 사이클 침범**: TDD 내부 단계(simplify, spec self-check)를 /go가 관리
- **에이전트 프로토콜 중앙집중**: spec-verifier, QA, Meta QA 호출 방법을 /go가 80줄 넘게 기술
- **검증 기준 중앙관리**: 12개 스킬의 정량 기준을 /go 테이블이 관리 (shotgun surgery)

## Summary

| 변경 | 행동 |
|------|------|
| `/self-check` 스킬 생성 | spec 시나리오 ↔ import chain 추적 절차를 독립 스킬로 |
| 파이프라인 순서 재배치 | `red → green → self-check → refactor → bind` |
| §Spec Self-Check 이동 | /go에서 삭제 → /self-check SKILL.md로 |
| §에이전트 프로토콜 이동 | /go에서 삭제 → 각 AGENT.md로 |
| 검증 기준 분산 | /go 테이블 삭제 → 각 스킬 Exit Criteria로 |
| /plan에 /divide 전제 추가 | /plan 진입 시 /divide 미실행이면 먼저 실행 |

## Prior Art

- url-routing 사건: register.ts에 코드 존재 but import 누락 → spec-verifier FAIL을 무시하고 진행 → 미동작 발견
- Kent Beck TDD: Red-Green-Refactor는 하나의 사이클
