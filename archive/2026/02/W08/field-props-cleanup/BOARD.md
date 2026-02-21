# BOARD — field-props-cleanup

> Scale: Light | Created: 2026-02-21

## Now

(비어있음 — 모든 태스크 완료)

## Done

- [x] T1: Field.tsx — EditableProps rename + prop 제거 + 내부 도출 로직
  - `FieldProps` → `EditableProps`
  - `multiline`, `blurOnInactive`, `as`, `target`, `controls` 제거
  - `name` required 강화
  - `fieldType` → multiline CSS, aria, as tag 내부 도출
  - `mode` → blurOnInactive 내부 도출

- [x] T2: 소비자 마이그레이션
  - `TaskItem.tsx`: `blurOnInactive={true}` 제거
  - `NCPHeroBlock.tsx`: `multiline` → `fieldType="block"`, `as="div"` 제거 (4곳)
  - `NCPNewsBlock.tsx`: `multiline` → `fieldType="block"` (4곳)
  - `NCPServicesBlock.tsx`: `multiline` → `fieldType="block"` (2곳)
  - `NCPFooterBlock.tsx`: `multiline` → `fieldType="block"` (1곳)

- [x] T3: defineApp.bind 타입 보강
  - `defineApp.bind.ts`: FieldComponent props에 `mode`, `fieldType` 추가, `blurOnInactive` 제거
  - `defineApp.types.ts`: BoundComponents.Field 타입 갱신

## Ideas

- `fieldType` 이름 재검토 (현재: 전파 비용 > 이득 → 보류)
- `target` + `controls` combobox 패턴 구현 시 재추가
