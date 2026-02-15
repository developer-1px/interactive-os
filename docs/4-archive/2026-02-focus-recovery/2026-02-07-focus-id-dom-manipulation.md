# FOCUS_ID 이펙트의 직접 DOM 조작 문제

## 1. 개요 (Overview)

`navigationMiddleware`가 `FOCUS_ID` 이펙트를 처리할 때 `document.getElementById` + `element.focus()` 로 DOM을 직접 조작하고 있다. 이는 React의 선언적 패러다임과 충돌하며, Paste 후 포커스 이동이 실패하는 직접적인 원인이다.

**핵심 모순**: 순수함수 기반 상태 관리 → React 렌더링이라는 설계 의도와, middleware 내 명령적 DOM 조작이 공존하고 있다.

## 2. 분석 (Analysis)

### 현재 흐름 (문제)

```
PasteTodo.run() → newState.effects = [{ type: "FOCUS_ID", id: newId }]
    ↓
navigationMiddleware (Zustand set() 안에서 동기 실행)
    ↓
document.getElementById(newId) → null ❌ (React가 아직 렌더하지 않음)
```

문제의 `navigationMiddleware` 코드:

```ts
// middleware가 Zustand set() 콜백 내에서 동기적으로 실행됨
const targetEl = document.getElementById(targetId);  // ← 직접 DOM 조회
if (targetEl) {
    data.store.setState({ focusedItemId: targetId });
    targetEl.focus({ preventScroll: false });  // ← 직접 DOM 조작
}
```

### 올바른 React 흐름 (목표)

```
Command → State 변경만 (순수함수)
    ↓
React 리렌더 → 새 아이템 DOM 생성
    ↓
useEffect → focusedItemId 변경 감지 → .focus() 호출
```

### 영향 범위

`FOCUS_ID` 외에도 `SCROLL_INTO_VIEW` 이펙트도 동일하게 직접 DOM 조작 중이다.

## 3. 제안 (Proposal)

**effects 배열을 DOM 명령이 아닌 "상태 변경 의도"로만 사용한다.**

- `FOCUS_ID` → `focusedItemId` state만 업데이트 (이미 zone store에 존재)
- React 컴포넌트 (`FocusItem` 등)가 `focusedItemId` 변경을 감지하여 `useEffect` → `.focus()` 
- `requestAnimationFrame` 해킹이나 retry loop 불필요
- 순수함수 원칙 유지, React 렌더 사이클과 자연스럽게 동기화

```
Before: effects → middleware → DOM 직접 조작
After:  effects → middleware → state만 변경 → React → DOM
```
