# builder-property-schema

## Context

Claim: Web Primitive Registry (encode/decode/Widget) + Block Schema (type별 조합) = 3계층 OCP. 각 Primitive는 자기 최적 구조를 가지고, encode/decode 파이프라인이 경계의 Transform.

Before → After:
- Before: `inferFieldType(key)` heuristic, `PropertyType` 유령 타입, 모든 값이 flat string
- After: Primitive Registry가 type → encode/decode/Widget 제공. Block Schema가 block.type → field 조합 선언. Panel은 디스패처.

Backing: Gutenberg block.json, Webflow Properties, Framer PropertyControls, Atomic Design

Risks: 기존 캔버스 렌더러가 `fields[key]` 직접 접근 → decode 호출 추가 필요. encode/decode 오버헤드 (단순 text는 identity).

## 🔴 Now

(All tasks complete — Phase 4 회고 대기)

## ⏳ Done

- [x] T1: Primitive 타입 12종 + encode/decode — `model/primitives.ts` | 25 tests | all green ✅
- [x] T2: Block Schema 10 block types — `model/blockSchemas.ts` | schema lookup + fallback 검증 ✅
- [x] T3: Widget Registry 12 widgets — `widgets/PropertyWidgets.tsx` | Button에 href 필드 추가 ✅
- [x] T4: Panel OCP 리팩토링 — `inferFieldType` 제거, `FieldInput` schema 디스패처 | tsc 0 ✅
- [x] T5: PropertyType 정리 — `PrimitiveType`이 대체. app.ts export 제거 ✅

## Unresolved

- Schema 파일 위치: co-location (각 블록 렌더러 옆) vs centralized (`model/blockSchemas.ts`)
- Compound field decode 시 캔버스 렌더러 수정 범위 측정

## 💡 Ideas

- Primitive Widget을 OS 레벨로 승격 → 모든 Builder 앱이 공유
- Schema로부터 validation 자동 생성
- Schema로부터 AI에게 "이 블록에는 이런 속성이 있다" 자동 제공
