# KeyboardInput 동형화

> **Goal**: `simulate.ts`가 `senseKeyboard.ts`와 동일한 `KeyboardInput`을 생산하도록 정렬하고,
> Dead field를 제거하여 인터페이스를 정리한다. Zero Drift 약속을 구조적으로 보장한다.
>
> **Type**: Meta (OS 인프라)
> **Origin**: Todo 개밥먹기 → `/discussion` 2026-03-07

## Now

(비어있음 — /audit 대기)

## Next

- [ ] WP4: Trigger 필드 동형화 — overlay stack에서 유도
- [ ] WP6: zero-drift.md L4 레이어 문서화

## Later

(없음)

## Done

- [x] WP1: Dead field 제거 — `focusedItemRole`, `focusedItemExpanded` — tsc 0 | headless 24/24 ✅
- [x] WP2: `isFieldActive` 동형화 — `isKeyDelegatedToOS(key, fieldType)` — tsc 0 | headless 24/24 ✅
- [x] WP3: `isEditing` 동형화 검증 — managed tension (동작 동형, 경로 이형) ✅
- [x] WP5: 동형성 계약 테스트 — 11 tests, navigating/editing/shape 커버 — tsc 0 | 529/529 ✅
- [x] simulate.ts editingFieldId 수정 — `zone?.editingItemId ?? entry?.fieldId` (2026-03-07)
- [x] buildKeyboardInput 추출 — simulate에서 KeyboardInput 구성을 별도 함수로 분리
