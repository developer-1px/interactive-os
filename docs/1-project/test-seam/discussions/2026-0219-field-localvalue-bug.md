# Field localValue Reset 버그 — 진단 기록

> 2026-02-19 | todo-enter-bug → test-seam 프로젝트 계기

## 증상

- Draft 필드에 영문 텍스트 입력 후 Enter → 아이템 생성 안 됨
- 한글은 동작함 (라는 최초 보고 — 실제로는 글자 수 차이)

## 진단 과정

### 1차 가설: isComposing (기각)

한글 IME의 `isComposing` 플래그가 영문 Enter를 막는다는 가설.
→ E2E 디버깅 결과: `isComposing=false, keyCode=13, isEditing=true, isFieldActive=true` ✅
→ Enter 키 인터셉트 자체는 정상 동작

### 2차 가설: focus 이탈 (기각)

타이핑 중 Draft에서 포커스가 다른 요소로 이동한다는 가설.
→ 글자별 추적: `data-focused=true` 유지 ✅

### 3차 가설: localValue 미동기화 (확정)

`FIELD_COMMIT`이 읽는 `FieldRegistry.localValue`가 빈 문자열이라는 가설.
→ **확정**: 2글자("Hi")든 5글자("Hello")든 `localValue = ""` 🔴
→ "Hi"가 성공한 건 `addTodo`의 fallback 경로 (`payload.text ?? draft.ui.draft`)

### 근본 원인

```
defineApp.bind.ts   ─→  매 렌더마다 새 onSubmit 함수 생성
     ↓ (새 참조)
Field.tsx useEffect  ─→  deps 변경 감지 → cleanup 실행
     ↓ (cleanup)
FieldRegistry        ─→  unregister("DRAFT") → register("DRAFT") → localValue: ""
     ↓ (빈 문자열)
FIELD_COMMIT         ─→  localValue 읽기 → "" → addTodo({text: ""}) → no-op
```

### 수정

```typescript
// Before: useEffect deps에 함수 포함
useEffect(() => { ... }, [name, mode, multiline, onSubmit, onChange, ...]);

// After: ref + stable wrapper
const onSubmitRef = useRef(onSubmit);
onSubmitRef.current = onSubmit;  // 매 렌더마다 최신 참조 저장

const stableOnSubmit = useRef(
  onSubmit ? (p) => onSubmitRef.current!(p) : undefined
);

useEffect(() => { ... }, [name, mode, multiline, updateType]);  // 함수 deps 제거
```

## 교훈

1. **717개 유닛 테스트가 잡지 못한 이유**: 각 모듈을 독립 검증. 4개 모듈의 합성 문제는 범위 밖.
2. **필요한 테스트 유형**: Component Integration (seam test) — React lifecycle + vanilla store 사이의 동기화.
3. **`useEffect` deps에 함수를 넣는 것은 known React anti-pattern**. 특히 부모에서 인라인으로 생성되는 함수.
