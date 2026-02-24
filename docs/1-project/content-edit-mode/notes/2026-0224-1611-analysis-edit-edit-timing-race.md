# EDIT→EDIT 전이 타이밍 레이스

| 항목 | 내용 |
|------|------|
| 원문 | editmode에서 text를 누르면 edit 모드 유지해야 하는데? state 다이어그램이나 도미노 효과 한번 순서대로 정리를 다시 해봐 |
| 내(AI)가 추정한 의도 | EDIT→EDIT 전이가 작동하지 않는 근본 원인을 파악하고, 타이밍 레이스를 해결할 아키텍처적 해법을 찾아야 한다 |

## 1. 개요

EDIT 모드에서 다른 텍스트 아이템을 클릭하면 EDIT 유지되어야 하지만, mousedown→React render→click 사이의 타이밍 레이스로 editingItemId가 중간에 지워져서 click handler가 EDIT 모드를 감지하지 못함.

## 2. 도미노 체인

```
① mousedown → OS_FOCUS(item-B) → focusedItemId = "item-B"
② React render (동기) → item-A Field: isContentEditable false
   → exitedEditing = true → OS_FIELD_COMMIT → editingItemId = null
③ click → handleEditModeClick: editingItemId === null → EDIT 아닌 걸로 판단
   → handleSelectModeClick → SELECT 처리 (FIELD_START_EDIT 안 함)
```

핵심 문제: **②와 ③ 사이에 editingItemId가 이미 사라짐.**

## 3. 해법 후보

### A: mousedown에서 "was editing" 스냅샷 (preClickFocusedItemId 패턴 재활용)
- mousedown에서 `preClickEditingItemId`를 저장
- click handler에서 `zone.editingItemId || preClickEditingItemId`로 EDIT 모드 판별
- 장점: 기존 preClickFocusedItemId 패턴과 동일
- 단점: MouseListener에 또 상태 추가

### B: Field auto-commit을 useEffect로 디퍼 (useLayoutEffect → useEffect)
- commit dispatch를 다음 마이크로태스크로 미룸
- click이 먼저 처리된 후 commit 발생
- 장점: 타이밍 문제 자연 해결
- 단점: useLayoutEffect → useEffect 변경이 다른 부작용 가능 (DOM 복원 타이밍)

### C: click handler에서 Field 유무 + focusedItemId 변경으로 EDIT 진입 판단
- `editingItemId`에 의존하지 않고, `preClickEditingItemId !== null && hasField` 조건 사용
- 장점: 가장 확실
- 단점: A와 본질적으로 같음

### 추천: A
- 이미 `preClickFocusedItemId` 패턴이 검증됨
- MouseListener에 `let preClickEditingItemId` 하나만 추가
- click handler에서 이 값으로 "방금까지 EDIT 모드였는가?" 판별

## 4. Cynefin 도메인 판정

🟢 **Clear** — mousedown에서 스냅샷 패턴은 이미 검증됨 (preClickFocusedItemId). 동일 패턴 재활용.

## 5. 인식 한계

- useLayoutEffect에서 os.dispatch가 동기적으로 실행되는지, 아니면 배치되는지 확인하지 못했다. 비동기 배치라면 ③보다 늦게 실행될 수도 있다.

## 6. 열린 질문

없음 — Clear.

---

**한줄요약**: mousedown→click 사이에 Field auto-commit이 editingItemId를 지워서 EDIT→EDIT 전이 실패. `preClickEditingItemId` 스냅샷으로 해결.
