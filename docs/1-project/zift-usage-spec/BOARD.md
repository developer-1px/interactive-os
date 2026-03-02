# zift-usage-spec

## Context

Claim: ZIFT의 Goal을 "Builder Usage Spec"(컴파일 안 되는 이상적 코드 + 컨셉맵 18개 대입)으로 먼저 확정해야 Spike↔Stabilize 무한 루프가 깨진다.

Before → After:
- Before: ZIFT 4-프리미티브의 ARIA/Data/CRUD 책임이 미정의. 부분 검증 반복, 레거시 축적.
- After: Zone이 유일한 Facade. `from`/`to`(serialize/deserialize) + `entity`(schema) + `with[]`(모듈 합성). 보편 NormalizedStore로 모든 구조 통합.

Backing:
- Readme-Driven Development (Tom Preston-Werner)
- Wishful Thinking Programming (SICP)
- Conceptual Integrity (Fred Brooks, Mythical Man-Month)
- Django Admin 선례 (Model 선언 → CRUD UI 자동 생성)

Risks:
- Builder가 너무 복잡하여 Usage Spec이 수렴하지 않을 위험
- NormalizedStore가 모든 구조를 진정으로 커버하는지 미검증
- 설계만 하고 구현 feasibility를 놓칠 위험

## Now

- [ ] T1: Usage Spec v3 — Builder 전체를 Zone+from/to+with[] 모델로 재작성. 컨셉맵 18개 빈칸 0 달성
- [ ] T2: NormalizedStore shape 확정 — List/Tree/Grid/Form/Kanban/Dropdown/Nested 7가지 케이스 탁상 검증
- [ ] T3: Zone 모듈 목록 확정 — crud/reorder/reparent/clipboard/activate/dnd/select + 타입 제약 규칙
- [ ] T4: Field 타입 확장 설계 — string/boolean/number 외 enum/color/date. OS 내장 vs 앱 커스텀 경계
- [ ] T5: Todo/Kanban Usage Spec — Builder 외 2개 앱으로 보편성 검증
- [ ] T6: 최종 정리 — official/ 문서 + rules.md 환류

## Done

(없음)

## Unresolved

- `entity`가 함수(동적 schema)인 경우 타입 안전성 보장 방법
- `<sidebar.View />` 자동 생성 UI가 ZIFT의 범위인가, Teo Design System 의존인가
- 여러 zone이 같은 데이터를 `from`하면 동기화 메커니즘
- Zone 모듈의 조합 규칙 (tree가 아닌데 reparent() → 타입 에러? 런타임 에러?)

## Ideas

- normalize/denormalize 헬퍼 라이브러리 (앱이 작성하지만 OS가 유틸 제공 가능)
- `app.zone()` 타입 추론: structure + entity에서 사용 가능한 모듈 자동 제한
- Grid의 column 리사이즈, 정렬, 필터를 모듈로 제공
