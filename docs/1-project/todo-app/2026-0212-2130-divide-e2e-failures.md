# /divide: Todo E2E Test Failures

> 12개 E2E 중 9개 통과, 3개 미해결

## 실행한 것 (정답 있음)

### Bug 1: Field `isContentEditable` = false
- **원인**: `osFocusedItemId("1") !== fieldId("EDIT")` → `isFocused = false` → `isContentEditable = false`
- **수정**: `isParentEditing` 추가 — `editingItemId`가 설정되면 자식 Field도 contentEditable
- **파일**: [Field.tsx](file:///Users/user/Desktop/interactive-os/src/os-new/6-components/primitives/Field.tsx)

### Bug 2: FIELD_COMMIT/CANCEL registry lookup 실패
- **원인**: `FieldRegistry.getField("1")` — 필드는 `"EDIT"`로 등록되어 있음
- **수정**: `document.activeElement.id` → fallback scan (모든 필드 순회)
- **파일**: [field.ts](file:///Users/user/Desktop/interactive-os/src/os-new/3-commands/field/field.ts)

### Bug 3: FIELD_COMMIT이 Draft(즉시 모드) 필드 미지원
- **원인**: `editingItemId === null` → early return → `AddTodo` 미실행
- **수정**: `editingItemId` 없어도 field lookup + onSubmit dispatch
- **파일**: [field.ts](file:///Users/user/Desktop/interactive-os/src/os-new/3-commands/field/field.ts)

### Bug 4: Draft DOM 텍스트 미정리
- **원인**: `AddTodo`를 `queueMicrotask`으로 비동기 dispatch → DOM 갱신 전 assertion 실패
- **수정**: 즉시 모드 필드의 `innerText` 동기 초기화
- **파일**: [field.ts](file:///Users/user/Desktop/interactive-os/src/os-new/3-commands/field/field.ts)

### Bug 5: `UpdateTodoText`가 payload.text 무시
- **원인**: `draft.data.todos[id].text = ctx.state.ui.editDraft` — contentEditable 입력은 `editDraft`를 업데이트하지 않음
- **수정**: `payload.text || editDraft` 사용
- **파일**: [list.ts](file:///Users/user/Desktop/interactive-os/src/apps/todo/features/commands/list.ts)

## 남은 것 (정답 없음 — 설계 결정 필요)

### Meta+Arrow 리매핑 충돌 (2개 테스트)
- `getCanonicalKey`가 Mac에서 `Meta+ArrowUp/Down` → `Home/End`로 변환
- OS_MOVE_UP/DOWN 키바인딩은 `Meta+ArrowUp/Down`으로 등록됨
- **결코 일치하지 않음**
- 선택지:
  1. 리매핑 제거 → Home/End 동작 깨짐
  2. 키바인딩을 `Home/End`로 변경 → 의미 혼란 (Home = 첫 아이템으로 vs Home = 위로 이동)
  3. 별도 키 사용 (예: `Ctrl+ArrowUp`)
  4. 리매핑은 유지하되, MOVE에 `Home/End` 바인딩 추가

### Sidebar keyboard navigation (1개 테스트)
- 별도 분석 필요
