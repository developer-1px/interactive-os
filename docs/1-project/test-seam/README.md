# test-seam — 테스트 피라미드 허리 채우기

## WHY

717개 유닛 테스트가 "Draft에 영문 입력 후 Enter"라는 기본 시나리오를 잡지 못했다.

**근본 원인**: `defineApp.bind`가 매 렌더마다 새 함수 참조를 생성 → `Field.tsx`의 `useEffect` deps가 변경 → `FieldRegistry.unregister → register` → `localValue: ""` 리셋.

이 버그는 **4개 모듈의 합성(compose)** 에서 발생하는 창발적 문제였다.
유닛 테스트는 각 모듈이 올바르게 동작하는지 증명했지만, 모듈 **경계(seam)** 를 검증하지 않았다.

717개 유닛 중 상당수는 같은 패턴의 데이터 변주(role lookup 반복, 같은 로직의 방향 분기)다.
반면 실제 버그가 발생하는 **모듈 간 경계**에는 테스트가 0개였다.

## Goals

1. **경계(seam) 테스트 신설** — FieldRegistry ↔ Field.tsx ↔ FIELD_COMMIT 같은 cross-layer 흐름 검증
2. **중복 유닛 테스트 정리** — 같은 로직의 데이터 변주를 `test.each`로 압축
3. **`/test` 워크플로우 개정** — Level 2를 "kernel command chaining"에서 "seam testing"으로 확장
4. **coverage-gap 문서 갱신** — "E2E 영역"으로 분류된 항목 중 seam test 대상 재분류

## Scope

- `/test` 워크플로우 개정
- 기존 유닛 테스트 중복 분석 및 압축
- seam test 템플릿/패턴 정의
- Field lifecycle seam test 작성 (증거: 이번 버그)
- coverage-gap 문서 갱신

## Out of Scope

- E2E 테스트 추가 (별도 프로젝트)
- TestBot 런타임 변경
- 새 테스트 프레임워크 도입
