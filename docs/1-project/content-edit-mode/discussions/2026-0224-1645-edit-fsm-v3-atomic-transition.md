# Discussion: EDIT Mode FSM v3 — 원자적 전이와 State 기반 통합

> 생성일: 2026-02-24 16:45
> 범위: content-edit-mode 프로젝트, T5~T7 확장

---

## Journey

**🧑 사용자**: EDIT 모드에서 다른 아이템 클릭 시 blur가 안 돼. editingItemId가 안 지워져.

**🤖 AI**: MouseListener에 OS_FIELD_COMMIT + blur() 직접 넣어서 해결 시도.

**🧑 사용자**: 그게 말이 되니? blur의 책임은 Field에 있는데 Mouse에 넣으면 어떻게 해?

---

**🤖 AI**: 맞다. Field 레이어(useFieldFocus)에서 focusedItemId 변경 감지 → auto-commit으로 변경. /divide 실행:
- D1: MouseListener에서 COMMIT 제거
- D2: Field.tsx에서 isContentEditable 전이 감지 → COMMIT  
- D3: OS_FIELD_COMMIT의 focusedItemId 복원 조건부로

---

**🧑 사용자**: EDIT→EDIT 전이가 안 된다. editingItemId가 mousedown→click 사이에 지워지잖아.

**🤖 AI**: Field auto-commit이 React render 중에 끼어들어 editingItemId를 null로 만듦. preClickEditingItemId 스냅샷으로 해결.

**🧑 사용자**: 왜 mousedown 때 판단 안 하고 click에서 하는 건데?

**🤖 AI**: 맞다. EDIT→EDIT는 mousedown에서 직접 OS_FIELD_START_EDIT dispatch. click EDIT 분기 제거.

---

**🧑 사용자**: Field auto-commit이 현재 editingItemId(B)를 커밋하지 않나? A → B 원자 전환이면.

**🤖 AI**: 맞다. Field auto-commit 가드 추가: `currentEditingId === fieldId`일 때만 커밋 (EDIT→SELECT 전용). OS_FIELD_START_EDIT에 이전 field 값 커밋 로직 추가.

---

**🧑 사용자**: 클릭 커서 위치(I-beam) 연동은? FieldRegistry offset 기반으로 해야지.

**🤖 AI**: placeCaretAtPoint(DOM 직접 조작)를 seedCaretFromPoint(state 기반)로 교체. caretRangeFromPoint → offset → FieldRegistry → useFieldFocus 파이프라인 통합.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | EDIT 모드 전이는 (1) mousedown에서 결정, (2) OS_FIELD_START_EDIT이 원자적으로 처리, (3) caret은 state 기반 파이프라인으로 통합해야 한다 |
| **📊 Data** | mousedown→React render→click 타이밍 레이스. DOM blur 미발생 (부모↔자식). FieldRegistry가 caret source of truth. |
| **🔗 Warrant** | (1) 책임 분리: Mouse=focus/select, Field=lifecycle, Command=state 전이. (2) 원자성: editingItemId A→B, null 경유 없음. (3) 선언형: DOM 직접 조작 대신 state→render 파이프라인. |
| **📚 Backing** | React 동기 렌더 모델. contentEditable의 DOM focus/blur 한계. ZIFT Responder Chain. |
| **⚖️ Qualifier** | **Clear** — 모든 경로(EDIT→EDIT, EDIT→SELECT, Escape, SELECT→EDIT) 검증됨 |
| **⚡ Rebuttal** | cursor:default/text 전환이 아직 미동작 (deferred style 이슈). Enter=줄바꿈 UX 추가 결정 필요 (그룹 인터뷰). |
| **❓ Open Gap** | cursor 스타일 동작 확인. Enter 기본 동작 UX 리서치. |

## 변경 파일 요약

| 파일 | 변경 |
|------|------|
| `MouseListener.tsx` | mousedown에서 EDIT→EDIT 직접 처리, seedCaretFromPoint(state 기반), dispatchCommands 인라인 |
| `Field.tsx` | auto-commit 가드 (EDIT→SELECT 전용), plaintext-only, cursor style, Enter=줄바꿈(block) |
| `startEdit.ts` | 이전 field 값 커밋 + caret 저장, 원자적 전이 |
| `commit.ts` | focusedItemId 조건부 복원 |
| `resolveFieldKey.ts` | Escape → COMMIT (이전 세션) |
| `hierarchicalNavigation.ts` | drill-down fallback (section→item) |
