# /redteam 분석: Focus Single Path

> 생성: 2026-02-21 03:06
> 주제: `.focus()` 이중 경로 통합 방향

## 🔴 레드팀 공격

### 1. 이중 경로는 의도적 안전망
경로 A(4-effects)는 React가 DOM을 업데이트하기 **전에** 실행. 새 아이템 추가 시 DOM이 아직 없어서 실패.
경로 B(FocusItem useLayoutEffect)가 React 렌더 후 실행되어 **safety net** 역할.

### 2. 단일 경로는 허상
React 렌더 사이클과 커맨드 effect 사이클의 타이밍이 근본적으로 다르다.
경로 A(4-effects)로 통합하면 `requestAnimationFrame` 해킹이 필요해진다.

### 3. ROI가 낮다
이중 경로가 **실제 버그를 일으킨 적 없음**. 동작하는 코드를 원칙 준수를 위해 리팩토링하는 비용 vs. builder-v2 등에 집중하는 기회비용.

### 4. K1 수정이 깜빡임 유발
`useEffect`는 paint **후** 실행 → 1프레임 동안 `isParentEditing=false` → contentEditable 깜빡임.
→ **즉시 수정**: `useLayoutEffect`로 교체 완료.

### 5. DOM_ZONE_ORDER는 필연
DOM 순서는 Portal, StrictMode에서 ZoneRegistry로 추적 불가. 전역 DOM 순회가 유일한 방법.

## 🔵 블루팀 방어

### 1. 경로 B만 남기면 해결
focus는 항상 state 변경 수반 → React useLayoutEffect가 가장 안전한 타이밍.
4-effects/focus를 **폐지**하면 이중 실행 사라짐.

### 2. 역할 분리
focus(state 수반) = Component 영역, scroll/clipboard(state 무관 DOM 부수효과) = Effect 영역.

### 3. 기술 부채의 복리 이자
규칙과 현실의 괴리가 학습 비용을 올린다. 새 컴포넌트마다 `.focus()` 위치 고민 = Rule #6 위반.

## 📊 합의

| 쟁점 | 결론 |
|------|------|
| 통합 방향 | **경로 B(Component)를 주 경로로. 4-effects/focus 폐지.** |
| 역할 분리 | focus=Component, scroll/clipboard=Effect |
| T5 DOM_ZONE_ORDER | 폐기 또는 최하위 우선순위 |
| K1 깜빡임 | ✅ useLayoutEffect로 즉시 수정 완료 |
| 프로젝트 우선순위 | 유지하되 builder-v2보다 낮춤 |

## 방향 전환

**Before**: "4-effects로 `.focus()`를 중앙 집중화하자"
**After**: "focus는 Component의 책임이다. 4-effects/focus는 폐지한다."
