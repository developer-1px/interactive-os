# [Closed] Field resetOnSubmit — contentEditable DOM 미동기화

> 보고일: 2026-03-04
> 재현: Todo → 드래프트 필드에 텍스트 입력 → Enter → todo 추가됨 → **필드 텍스트가 유지됨** (사라져야 함)

## D2. Triage

**P1 (기능불가)** — Enter로 연속 todo 추가가 불가. 두 번째 Enter 시 같은 텍스트가 중복 추가됨.

## D3. Diagnose

- `Field.tsx:handleCommit` (line 186-188): `resetOnSubmit` 시 `FieldRegistry.reset(fieldId)` 호출
- `FieldRegistry.reset()`: 상태를 `defaultValue`로 리셋 → 정상 동작
- **문제**: contentEditable `<div>`의 `innerText`는 React 상태와 동기화되지 않음
- DOM sync 로직 (line 298-334)은 `isContentEditable` 변경 시에만 실행 → Enter 후 포커스 유지 상태에서는 미트리거

## D4. Plan

- **근본 원인**: `FieldRegistry.reset()` 호출 후 contentEditable DOM element의 `innerText` 동기화 코드 부재
- **해결 방향**: 기존 메커니즘 재사용 — 같은 파일 내 3곳에서 `innerRef.current.innerText = value` 패턴 사용 중
- **수정 파일 목록**: `packages/os-react/src/6-project/field/Field.tsx` (1파일)
- **엔트로피 체크**: 새로운 유일한 패턴 추가? → **No.** 기존 패턴 재사용.
- **설계 냄새 4질문**:
  - 개체 증가? No
  - 내부 노출? No
  - 동일 버그 타 경로? No — resetOnSubmit 사용처는 Todo draft 1곳
  - API 확장? No
