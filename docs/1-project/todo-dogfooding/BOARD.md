# Todo Dogfooding — BOARD

## 🔴 Now

(없음 — 모든 Now 태스크 완료)

## ✅ Done

- [x] **T4: Toast / Undo Feedback** [Light] ✅
  - OS에 `ToastEntry` 상태 + `OS_TOAST_SHOW`/`OS_TOAST_DISMISS` 커맨드 신규
  - `ToastContainer` 컨포넌트: `aria-live="polite"`, 자동 해제 타이머, 액션 버튼
  - 삭제 확인/완료 삭제 후 "N task(s) deleted · Undo" 토스트 표시

- [x] **T3: Bulk Action Bar** [Light] ✅
  - `useSelection("list")` 기반 선택 감지
  - `selection.length > 1` 시 절대 위치 하단 Action Bar 표시
  - Delete + Complete 배치 커맨드 연동, `bulkToggleCompleted` 신규 커맨드

- [x] **T2: Search / Combobox** [Light] ✅
  - `ui.searchQuery` 상태 추가, `selectVisibleTodos`/`selectVisibleTodoIds` 검색 필터 확장
  - `TodoSearch` zone (textbox) + `setSearchQuery`/`clearSearch` 커맨드
  - 검색 결과 0건 시 빈 상태 메시지 분기 (검색 vs 목록 비어있음)

- [x] **T1: Dialog (삭제 확인)** [Heavy] ✅
  - OS alertdialog 패턴: 포커스 트랩, Escape 닫기, Return Focus
  - 콜렉션 존 `onDelete` 인터셉트하여 `OS_OVERLAY_OPEN` 연결
  - 삭제 개수에 따른 메시지 표시 및 테스트 작성 완료

## 💡 Ideas

- T5: Context Menu — 우클릭 메뉴, 포커스 관리, 키보드 네비게이션
- T6: Drag & Drop — 마우스 드래그 순서 변경, ghost/indicator
- T7: Date Picker — 마감일 입력, 캘린더 grid 네비게이션
- T8: Export / Import — JSON 내보내기/가져오기, File API 연동

## 📎 References

- Product Vision: `6-products/todo/VISION.md`
- Existing Spec: `6-products/todo/spec/crud-and-interactions.md`
- OS Vision: `6-products/os/VISION.md`
- Discussion: `discussions/2026-0221-1359-todo-dogfooding-prd.md`
- RFC: `README.md`
- PRD: `prd.md`
