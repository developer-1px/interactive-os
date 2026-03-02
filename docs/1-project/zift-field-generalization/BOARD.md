# zift-field-generalization

## Context

Claim: **Field = Entity Property Owner.** FieldType을 9종으로 일반화. FieldValue는 `string | boolean | number | string[]`.

Before → After:
- `FieldType = "inline" | "tokens" | "block" | "editor"` → `+ "boolean" | "number" | "enum" | "enum[]" | "readonly"`
- `FieldState.value = string` → `FieldValue = string | boolean | number | string[]`
- `FieldConfig.defaultValue = string` → `FieldValue`
- `FieldConfig.options?: readonly string[]` (enum 선택지)
- `resolveFieldKey`: text only → + boolean/number/enum/readonly keymaps
- `resolveItemKey`: switch/checkbox/slider → Field layer 이동
- `resolveKeyboard`: editingFieldId → + activeFieldType (Layer 1b)
- `fieldKeyOwnership`: text → + boolean/number/enum/enum[]/readonly passthrough
- `ROLE_FIELD_TYPE_MAP`: role→FieldType 공유 상수

## Now
(empty — all tasks complete)

## Done
- [x] T1: FieldType 확장 (boolean/number) — +3 tests ✅
- [x] T2: resolveFieldKey 확장 (boolean/number keymaps) — +12 tests ✅
- [x] T5: fieldKeyOwnership 확장 (boolean/number passthrough) — +7 tests ✅
- [x] T4: computeItem 내부 추출 ✅
- [x] T6: KI + official/ 문서 갱신 ✅
- [x] T7: Field Presence (activeFieldType + Layer 1b) ✅
- [x] T3: resolveItemKey 정리 (checkbox/switch/slider → Field) ✅
- [x] T8: computeFieldAttrs 내부 추출 ✅
- [x] T9: FieldType 확장 (enum/enum[]) — +2 tests ✅
- [x] T10: resolveFieldKey — enum keymap — +3 tests ✅
- [x] T11: fieldKeyOwnership — enum/enum[] passthrough — +6 tests ✅
- [x] T12: FieldValue 일반화 (string→FieldValue) — +6 tests ✅
- [x] T13: defaultValue 일반화 (string→FieldValue) — T12에 포함 ✅
- [x] T14: readonly FieldType — +4 tests ✅
- [x] T15: FieldConfig.options (enum 선택지) — +2 tests ✅

## Unresolved
(empty)

## Ideas
- `App.createField({ type, role })` → 앱 레이어 선언형 API (별도 프로젝트)
- rating(⭐), segmented control → enum visual variant (UI 레이어)
