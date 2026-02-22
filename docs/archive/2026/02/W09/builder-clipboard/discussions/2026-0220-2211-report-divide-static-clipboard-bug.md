# [Divide Report] Builder Static Clipboard Bug

**Date**: 2026-02-20
**Domain**: Complicated

## 1. 대상 분석 (Symptom vs Expected)
- **증상 1 (Copy)**: 정적 아이템(텍스트 필드)을 선택하고 Cmd+C를 누르면, 이전 클립보드에 남아있던 동적 아이템(섹션 등)이 그대로 유지된다. (시스템 클립보드에는 텍스트가 들어가지만, 내부 스토어가 갱신/초기화되지 않음).
- **증상 2 (Paste)**: 정적 아이템에서 Cmd+V를 누르면, 이전 동적 아이템이 부모 섹션 뒤에 통째로 삽입된다. (텍스트 교체가 아닌 구조적 확장이 일어남).
- **기대 동작**: 정적 아이템에서 Cmd+C → 시스템 클립보드 + 내부 클립보드에 '텍스트'로 저장. 정적 아이템에서 Cmd+V → 클립보드의 '텍스트'를 읽어 현재 필드의 값을 교체(`updateField`).

## 2. 분해 (Dimensions)

코드 추적 결과, 문제의 원인은 3개의 누락된 연결 고리다:

1. **내부 Store 미갱신 (Copy)**:
   - `app.ts`의 `onCopy`에서 `navigator.clipboard.writeText(text)`만 호출하고, 커맨드 결과로 `[]`를 반환. 
   - 이로 인해 `OS_CLIPBOARD_SET`이 발생하지 않아 `_clipboardStore`가 과거 상태에 머뭄.
   - **해결책**: 텍스트 복사 시에도 `OS_CLIPBOARD_SET` 커맨드(`clipboardWrite` 프로퍼티 활용)를 반환해야 함.

2. **텍스트 아이템 타입 식별 누락 (Store)**:
   - `_getClipboardPreview()`에서 반환하는 객체가 구조적인 Block인지(텍스트인지) 판별할 수단이 필요.
   - `OS_CLIPBOARD_SET`에 넘길 때 `{ type: "text", value: "..." }` 형태의 명시적 객체를 넘겨야 `onPaste`에서 식별 가능.

3. **필드 값 교체 로직 누락 (Paste)**:
   - `onPaste`에서 `_getClipboardPreview()` 결과가 `type === "text"`인 경우, 구조 삽입(bubbling) 루프를 타면 안 됨.
   - 대신 현재 포커스된 `cursor.focusId`를 대상으로 `updateFieldByDomId` (또는 `updateField`) 커맨드를 dispatch하여 필드 값을 교체해야 함.

## 3. Cynefin 판단
**Complicated (분석하면 답이 보임)**. 새로운 시스템을 발명할 필요 없이 기존 `OS_CLIPBOARD_SET`과 `updateField`를 연결하면 해결된다.

## 4. 증거 수집 전략 (단위 테스트)
이것은 순수함수(pasteBubbling) 밖의, **커맨드 조합 로직** 문제다.
`app.ts`의 `onCopy`와 `onPaste`가 올바른 커맨드(payload)를 반환하는지만 검증/수정하면 된다. 
1. `onCopy` 수정 → 반환된 커맨드가 `clipboardWrite`를 포함하는지 확인
2. `onPaste` 수정 → 텍스트 페이로드일 때 `updateField` 커맨드를 반환하는지 확인

## 5. 실행 계획 (Step 6 /solve 로 이동)
1. `onCopy`: 정적 아이템 복사 시 `sidebarCollection.copy()` 대신 `OS_CLIPBOARD_SET`과 동일한 효과를 낼 수 있도록, `createCollectionZone`의 기존 메커니즘을 흉내내거나 특수한 반환 객체(예: `clipboardWrite: { text, isStructural: false }`)를 반환. (또는 단순히 빈 배열을 반환하지 말고 텍스트 아이템을 클립보드에 সেট)
2. `onPaste`: `clipData = _getClipboardPreview()`가 텍스트인지 검사. 맞다면 `updateField` 반환, 아니면 기존 `pasteBubbling` 수행.
