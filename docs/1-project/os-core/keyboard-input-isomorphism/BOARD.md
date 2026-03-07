# KeyboardInput 동형화

> **Goal**: `simulate.ts`가 `senseKeyboard.ts`와 동일한 `KeyboardInput`을 생산하도록 정렬하고,
> Dead field를 제거하여 인터페이스를 정리한다. Zero Drift 약속을 구조적으로 보장한다.
>
> **Type**: Meta (OS 인프라)
> **Origin**: Todo 개밥먹기 → `/discussion` 2026-03-07

## Now

- [ ] WP1: Dead field 제거 — `focusedItemRole`, `focusedItemExpanded` 제거
- [ ] WP2: `isFieldActive` 동형화 — `isKeyDelegatedToOS(key, fieldType)` 호출

## Next

- [ ] WP3: `isEditing` 동형화 검증 — immediate mode field 케이스 점검
- [ ] WP5: 동형성 계약 테스트 — drift 발생 시 즉시 탐지하는 단위 테스트

## Later

- [ ] WP4: Trigger 필드 동형화 — overlay stack에서 유도
- [ ] WP6: zero-drift.md L4 레이어 문서화

## Done

- [x] simulate.ts editingFieldId 수정 — `zone?.editingItemId ?? entry?.fieldId` (2026-03-07)
