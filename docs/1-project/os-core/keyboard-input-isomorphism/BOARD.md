# KeyboardInput 동형화

> **Goal**: `simulate.ts`가 `senseKeyboard.ts`와 동일한 `KeyboardInput`을 생산하도록 정렬하고,
> Dead field를 제거하여 인터페이스를 정리한다. Zero Drift 약속을 구조적으로 보장한다.
>
> **Type**: Meta (OS 인프라)
> **Origin**: Todo 개밥먹기 → `/discussion` 2026-03-07

## Now

- [ ] WP5: 동형성 계약 테스트 — drift 발생 시 즉시 탐지하는 단위 테스트

## Next

- [ ] WP4: Trigger 필드 동형화 — overlay stack에서 유도
- [ ] WP6: zero-drift.md L4 레이어 문서화

## Later

(없음)

## Done

- [x] WP1: Dead field 제거 — `focusedItemRole`, `focusedItemExpanded` — tsc 0 | headless 24/24 ✅
- [x] WP2: `isFieldActive` 동형화 — `isKeyDelegatedToOS(key, fieldType)` — tsc 0 | headless 24/24 ✅
- [x] WP3: `isEditing` 동형화 검증 — immediate mode의 경로 차이 확인 (동작 동형, 경로 이형). Draft/Search는 browser에서 DOM Field keydown handler가 Enter/Escape 처리, headless에서 resolveFieldKey가 처리. 결과 동일. Managed tension으로 기록 ✅
- [x] simulate.ts editingFieldId 수정 — `zone?.editingItemId ?? entry?.fieldId` (2026-03-07)

## Notes

### WP3: isEditing 경로 차이 (Managed Tension)

Browser(immediate mode textbox): `editingFieldId=null`, `isEditing=true` (DOM), fieldLayer 스킵 → DOM Field keydown 처리
Headless(immediate mode textbox): `editingFieldId="DRAFT"`, `isEditing=true`, fieldLayer 진입 → resolveFieldKey 처리

동작 결과는 동일(Enter→commit, Escape→cancel). 경로가 다른 이유:
textbox는 ROLE_FIELD_TYPE_MAP에 의도적으로 포함되지 않음 (editingFieldId lifecycle 전용).
Headless에서 entry?.fieldId fallback이 이 갭을 메운다.
