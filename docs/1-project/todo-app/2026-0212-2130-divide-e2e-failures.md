# /divide: Todo E2E Test Failures — ✅ 완료

> 12개 E2E 모두 통과 (2026-02-14)

## 실행한 것 (정답 있음)

### Bug 1: Field `isContentEditable` = false
- **원인**: `osFocusedItemId("1") !== fieldId("EDIT")` → `isFocused = false` → `isContentEditable = false`
- **수정**: `isParentEditing` 추가 — `editingItemId`가 설정되면 자식 Field도 contentEditable
- **파일**: Field.tsx

### Bug 2: FIELD_COMMIT/CANCEL registry lookup 실패
- **원인**: `FieldRegistry.getField("1")` — 필드는 `"EDIT"`로 등록되어 있음
- **수정**: `document.activeElement.id` → fallback scan (모든 필드 순회)
- **파일**: field.ts

### Bug 3: FIELD_COMMIT이 Draft(즉시 모드) 필드 미지원
- **원인**: `editingItemId === null` → early return → `AddTodo` 미실행
- **수정**: `editingItemId` 없어도 field lookup + onSubmit dispatch
- **파일**: field.ts

### Bug 4: Draft DOM 텍스트 미정리
- **원인**: `AddTodo`를 `queueMicrotask`으로 비동기 dispatch → DOM 갱신 전 assertion 실패
- **수정**: 즉시 모드 필드의 `innerText` 동기 초기화
- **파일**: field.ts

### Bug 5: `UpdateTodoText`가 payload.text 무시
- **원인**: `draft.data.todos[id].text = ctx.state.ui.editDraft` — contentEditable 입력은 `editDraft`를 업데이트하지 않음
- **수정**: `payload.text || editDraft` 사용
- **파일**: app.ts

### Bug 6: Space → toggleTodo 안 됨 (세션 2에서 해결)
- **원인**: `OS_SELECT`가 click에서도 `onCheck` delegate → W3C APG 위반. Click = select, Space = check 분리 필요
- **수정**: `KeyboardListener`에서 Space → `OS_CHECK` dispatch 추가, `OS_SELECT`에서 `onCheck` delegation 제거
- **파일**: KeyboardListener.tsx, select.ts

### Bug 7: Edit mode auto-focus 안 됨 (세션 2에서 해결)
- **원인**: `startEdit`이 앱 state의 `editingId`만 설정, OS state의 `editingItemId` 미설정 → Field의 `isParentEditing = false` → DOM focus 안 됨
- **수정**: `startEdit`에서 `FIELD_START_EDIT()` dispatch 추가
- **파일**: app.ts

### Bug 8: Escape cancel 작동 안 함 (세션 2에서 해결)
- **원인**: `FIELD_CANCEL`이 `onCancel`을 dispatch할 때 command factory function을 직접 전달. `kernel.dispatch(factory)` → factory에 `.type`이 없어 무시됨
- **수정**: `defineApp.ts`의 field binding에서 `onCancel`이 function이면 **호출**하여 command object로 변환
- **파일**: defineApp.ts

### Bug 9: Meta+Arrow reorder 안 됨 (세션 2에서 해결)
- **원인**: zone binding이 `cmd({ id: OS.FOCUS })`로 payload 생성하지만, `moveItemUp/Down` handler는 `payload.focusId` 참조 → **키 불일치** → `Number(undefined) = NaN` → early return
- **수정**: payload 키를 `focusId` → `id`로 통일 (app.ts, app-v3.ts, 테스트 파일)
- **파일**: app.ts, app-v3.ts, todo.test.ts, todo.v3.test.ts

### Bug 10: Sidebar Meta+Arrow 미등록 (세션 2에서 해결)
- **원인**: `TodoSidebarUI = sidebarZone.bind()`에 `onMoveUp`/`onMoveDown` 미등록
- **수정**: sidebar zone binding에 `onMoveUp: moveCategoryUp, onMoveDown: moveCategoryDown` 추가
- **파일**: app.ts

## 이전 "정답 없음" 항목 — 해결됨

### Meta+Arrow 리매핑 충돌 → **오진이었음**
- 원래 `getCanonicalKey`의 Mac normalize가 원인으로 의심했으나, 실제 코드는 이미 fallback 처리 완료
- **진짜 원인**: payload 키 불일치 (`focusId` vs `id`) + sidebar binding 누락
- 리매핑 설계 변경 불필요

### Sidebar keyboard navigation → **해결됨**
- `onMoveUp`/`onMoveDown` 바인딩 추가로 해결
