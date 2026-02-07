# Nested FocusGroup 활성화 문제

## 1. 개요

중첩된 FocusGroup (예: `os-shell` > `af-auto`)에서 자식 zone의 focus 변경이 부모 zone의 `onFocus`/`onBlur`를 트리거하여 잘못된 activeZone 설정이 발생하는 문제.

**현상:**
```
af-auto mount → autoFocus → firstItem.focus()
→ af-auto의 onFocus 발동 (O)
→ os-shell의 onBlur 발동 (X) ← 버블링으로 인한 오작동
→ os-shell이 activeZone이 됨 (잘못됨)
```

## 2. 해결 방안 비교

### 방안 A: DOM 기반 (closest 체크)

```tsx
onFocus={(e) => {
  // 이벤트가 nested zone에서 온 건지 체크
  if ((e.target as HTMLElement).closest('[data-focus-group]') !== e.currentTarget) {
    return; // nested zone의 이벤트는 무시
  }
  
  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
    FocusData.setActiveZone(groupId);
  }
}}
```

**장점:**
- 명확한 조건: "이 zone의 직접 자식만 처리"
- DOM 구조를 직접 검증
- 버블링 이벤트를 소스에서 차단

**단점:**
- DOM 쿼리 비용 (`closest`)
- React 이벤트 시스템과 DOM API 혼용

### 방안 B: State 기반 (React Aria)

```tsx
const isFocusWithinRef = useRef(false);

const onFocus = (e) => {
  // 이미 within 상태면 무시 (자식 간 이동)
  if (!isFocusWithinRef.current) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      FocusData.setActiveZone(groupId);
      isFocusWithinRef.current = true;
    }
  }
};

const onBlur = (e) => {
  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
    FocusData.setActiveZone(null);
    isFocusWithinRef.current = false;
  }
};
```

**장점:**
- React Aria의 검증된 패턴
- 순수 React 방식 (ref만 사용)
- 중복 호출 방지 명확

**단점:**
- 상태 관리 복잡도 증가
- onFocus/onBlur 쌍이 항상 對를 이뤄야 함

## 3. 레드팀 분석

### 방안 A의 위험
- **Q**: `closest`가 nested zone을 정확히 잡는가?
- **A**: Yes. `data-focus-group`이 모든 FocusGroup에 있으므로 안전.

- **Q**: 비용이 비싼가?
- **A**: `closest`는 부모 탐색이라 O(depth). 실제로 depth는 5 이하 → 무시 가능.

### 방안 B의 위험
- **Q**: `isFocusWithin` 상태가 동기화 안 되면?
- **A**: onFocus/onBlur가 쌍으로 실행 안 되는 엣지 케이스 존재 (예: React StrictMode, 비동기 unmount). 디버깅 어려움.

- **Q**: 부모/자식 zone 간 경쟁 조건?
- **A**: React 이벤트는 캡처→타겟→버블 순서라 안전하지만, 플래그 타이밍 이슈 가능.

## 4. 결론

### 추천: **방안 A (DOM 기반)**

**이유:**
1. **단순함**: 조건이 명확. "내 직접 자식의 이벤트만 처리."
2. **안전함**: DOM 구조는 ground truth. React state보다 신뢰.
3. **Best Practice 준수**: React Aria도 내부적으로 DOM 쿼리 사용 (`contains`). `closest`는 자연스러운 확장.
4. **디버깅**: Inspector에서 `e.target`과 `e.currentTarget` 바로 확인 가능.

**방안 B를 쓸 이유:**
- 이미 React Aria의 `useFocusWithin`을 직접 사용 중이라면.
- 우리는 custom implementation이므로 DOM 기반이 더 직관적.

### 구현

```tsx
onFocus={(e) => {
  const target = e.target as HTMLElement;
  const nearestGroup = target.closest('[data-focus-group]');
  
  // Only handle if this is the nearest FocusGroup
  if (nearestGroup !== e.currentTarget) return;
  
  // Only activate if entering from outside
  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
    FocusData.setActiveZone(groupId);
  }
}}

onBlur={(e) => {
  // Only deactivate if leaving to outside
  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
    FocusData.setActiveZone(null);
  }
}}
```
