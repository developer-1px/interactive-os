# [OPEN] Maximum update depth exceeded

**등록일**: 2026-02-20  
**우선순위**: P1 (특정 상황에서 무한 렌더링 루프 발생)

---

## 원문

```
Maximum update depth exceeded. This can happen when a component repeatedly
calls setState inside componentWillUpdate or componentDidUpdate. React limits
the number of nested updates to prevent infinite loops.
```

## 환경

- React 렌더링 런타임
- `npm run dev` (Vite dev server)
- 발생 라우트: 미확인 (콘솔 스택 트레이스 없음)

## 재현 단계

- 미확인 (사용자가 에러 메시지만 전달)

## 기대 결과

- 컴포넌트가 안정적으로 렌더링됨

## 실제 결과

- React가 무한 업데이트 루프를 감지하여 렌더링 중단

## 관련 이슈

- 없음

---

## Triage: P1

- 빌드 자체는 가능하지만, 특정 라우트에서 전체 UI가 멈출 수 있음
- 사용자 경험에 치명적

---

## 분석 (Before 스냅샷)

### 1차 용의자: `Field.tsx` — `useEffect` deps에 `fieldData?.state.value`

**Field.tsx L259-266:**
```tsx
useEffect(() => {
  if (
    !isContentEditableRef.current &&
    value !== fieldData?.state.value       // ← FieldRegistry 구독값
  ) {
    FieldRegistry.updateValue(fieldId, value);  // ← FieldRegistry 상태 변경
  }
}, [value, fieldId, fieldData?.state.value]);   // ← 구독값이 deps에 포함
```

**루프 경로:**
1. `fieldData?.state.value` 변경 → `useEffect` 재실행
2. `FieldRegistry.updateValue()` 호출 → `emit()` → listeners 호출
3. `useFieldRegistry` hook re-render → `fieldData?.state.value` 변경
4. → 1로 돌아감 (무한 루프)

### 2차 용의자: `FocusGroup.tsx` — `useLayoutEffect` deps에 인라인 콜백

**FocusGroup.tsx L321-338:**
```tsx
], [
  groupId, config, role, parentId,
  onDismiss, _onAction, _onSelect, _onCheck, _onDelete,
  _onMoveUp, _onMoveDown, _onCopy, _onCut, _onPaste,
  _onUndo, _onRedo, _itemFilter,
]);
```

- 소비자가 `onAction={() => ...}` 인라인 함수를 전달하면,
  렌더링마다 새 참조 생성 → `useLayoutEffect` 재실행 → `ZoneRegistry.register()` 재등록
- `ZoneRegistry` 변경이 다른 상태를 트리거하면 루프 가능

### 3차 용의자: `useFieldState` hook (useFieldHooks.ts L34-38)

```tsx
useEffect(() => {
  if (!isComposingRef.current && value !== localValue) {
    setLocalValue(value);    // ← localValue 변경
  }
}, [value, localValue]);     // ← localValue가 deps에 포함
```

- `localValue` 변경 → effect 재실행 → `setLocalValue` → `localValue` 변경 → ... 
- 단, `value !== localValue` 조건이 안전망 역할이라 이론상 루프 불발
- 단 초기화 타이밍에 race condition 존재 가능
