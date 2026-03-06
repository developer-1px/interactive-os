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
(empty — all tasks Done)

## Done

- [x] T1: Usage Spec v3 — Builder 전체 Zone+from/to+with[] 매핑 + 컨셉맵 18개 대입. 17✅ 1🟡(Field 동적 schema) 0❌ ✅
- [x] T2: NormalizedStore 7가지 케이스 탁상 검증 — List/Tree/Grid/Form/Kanban/Dropdown/Nested 전수 ✅
- [x] T3: Zone 모듈 카탈로그 — 9 OS 보편 + 1 앱 고유. 타입 제약: structure별 사용 가능 모듈 TypeScript 레벨 차단 ✅
- [x] T4: Field 타입 확장 — entity→FieldType 매핑 8종. color/date/relation은 앱 커스텀. 동적 entity는 함수형 ✅
- [x] T5: Todo/Kanban Usage Spec — 3앱 보편성 검증 완료. Zone 모델 수정 불필요 ✅
- [x] T6: 최종 정리 — official/os/zone-data-model.md 생성 + zift-spec.md §10 추가 + rules.md 참조 추가 ✅
- [x] T7: Trigger → 순수 투영 프리미티브 — computeTrigger 이미 구현 확인. usage-spec §8에 3-Phase 분리 계획 + 목표 모델 문서화 ✅

## Unresolved

(모두 해소됨)
- ~~`entity`가 함수(동적 schema)인 경우 타입 안전성~~ → T4: `Record<string, EntityFieldDef>` 리턴. TS 자동완성은 포기. Builder만 사용.
- ~~`<sidebar.View />` 자동 생성 UI~~ → ZIFT 범위 밖. Teo Design System 결정.
- ~~여러 zone이 같은 `from` 동기화~~ → T1 §4: `to`가 같은 state를 수정하므로 single source of truth로 자동 해결.
- ~~Zone 모듈 조합 규칙~~ → T3: TypeScript 레벨 차단. 런타임 없음.

## Ideas

- normalize/denormalize 헬퍼 라이브러리 (앱이 작성하지만 OS가 유틸 제공 가능)
- `app.zone()` 타입 추론: structure + entity에서 사용 가능한 모듈 자동 제한
- Grid의 column 리사이즈, 정렬, 필터를 모듈로 제공
