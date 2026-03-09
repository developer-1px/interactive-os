---
description: Unit 커버리지 측정 → 갭 분석 → /tdd + /go 자동 실행으로 커버리지를 올린다.
---

> **분류**: 오케스트레이터. 내부에서 /tdd, /go를 사용한다.

## 1. 커버리지 측정

npx vitest run --coverage 2>&1 | tail -100

전체 요약(All files)과 파일별 수치를 확인한다.

## 2. 갭 분류

파일별 커버리지를 3가지로 분류한다:

| 분류 | 기준 | 액션 |
|------|------|------|
| ✅ 충분 | Lines ≥ 80% | 유지 |
| 🔧 Unit 갭 | Lines < 80% + 순수 함수/로직 (resolver, middleware, util 등) | **테스트 추가 대상** |
| 🎭 E2E 영역 | Lines < 80% + React 컴포넌트/hooks (.tsx, use*.ts) | Unit 대상 아님 — 스킵 |
| 🎭 E2E 영역 | Lines < 80% + `kernel.defineCommand` 어댑터 (resolver가 별도 파일로 ≥80%) | Unit 대상 아님 — 스킵 |

## 3. 우선순위 도출

**Step 2에서 🔧 Unit 갭으로 분류된 파일만** Branch coverage 기준 오름차순 정렬한다.
(🎭 E2E 영역 파일은 Branch가 0%여도 대상에서 제외한다.)
Branch가 낮을수록 분기 로직이 미검증 → 버그 잠복 가능성 높음.

상위 3개 파일을 선정한다.

## 4. 자동 테스트 작성 루프

선정된 각 파일에 대해 순서대로:

### 4-1. /tdd 실행
해당 파일의 uncovered lines를 분석하고, /tdd 워크플로우를 실행하여
테스트를 먼저 작성한다.

### 4-2. /go 실행
작성된 테스트를 통과시키기 위해 /go 워크플로우를 실행한다.
(이미 구현된 코드의 커버리지 갭이므로, 대부분 테스트만 추가하면 통과한다.)

### 4-3. 커버리지 재측정
npx vitest run --coverage 2>&1 | grep "파일명"

해당 파일의 커버리지가 80% 이상이 되었는지 확인한다.
- 80% 이상 → 다음 파일로
- 80% 미만 → 4-1로 돌아가 추가 테스트 작성

## 5. 최종 검증

모든 대상 파일 처리 후:

npx vitest run --coverage 2>&1 | tail -100

전체 커버리지 변화를 확인한다.

## 6. 리포트 저장

분석 결과를 `docs/2-area/coverage-gap-YYYY-MMDD.md`에 저장한다:

- Before/After 전체 커버리지 비교
- 처리한 파일별 Before → After 수치
- 남은 갭 파일 목록

## 7. 결과 보고

- 전체 커버리지 Before → After
- 처리한 파일 수와 추가한 테스트 수
- 남은 Unit 갭 파일이 있으면 안내
