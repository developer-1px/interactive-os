# BOARD — test-seam

## 🔴 Now

(없음 — 모든 태스크 완료)

## ⏳ Done

- [x] Task 1: 유닛 테스트 중복 압축 (02-19)
  - rolePresets.test.ts: 163 → 19 tests (−144) — `it.each` 통합
  - 전체: 717 → 573 (−20%)
  - 커버리지 동일 유지 확인

- [x] Task 2: Seam 테스트 패턴 정의 (02-19)
  - `/test` 워크플로우 Level 2 확장 — "Command Flow + Seam" 이중 구조
  - Seam 식별 기준 3가지 정의
  - 템플릿 코드 2종 (Command Flow / Seam)

- [x] Task 3: Field lifecycle seam test 작성 (02-19)
  - `6-components/tests/integration/field-registry.test.ts` — 8 tests
  - register/unregister lifecycle 검증
  - FIELD_COMMIT → localValue 읽기 검증
  - stable wrapper pattern 검증

- [x] Task 4: coverage-gap 문서 갱신 (02-19)
  - `6-components`를 E2E 일괄 분류 → seam/E2E 분리
  - 🔗 Seam 영역 신설 (FieldRegistry, Field↔Registry)
  - 수치 업데이트 (645→581, seam 0→8)

## 💡 Ideas

- InputListener ↔ KeyboardListener seam test (isComposing 경계)
- defineApp.bind ↔ React render cycle 통합 검증 (jsdom 필요)
- 기존 E2E 중 `todoItem is not defined` 버그 수정
