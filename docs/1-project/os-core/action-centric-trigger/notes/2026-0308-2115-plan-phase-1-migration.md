# Phase 1: Simple Trigger Migration Plan

## 대상 전수 열거 (Target Components)

1. `src/pages/apg-showcase/patterns/AlertPattern.tsx` (Trigger 1개)
2. `src/pages/apg-showcase/patterns/ButtonPattern.tsx` (Trigger 2개)
3. `src/pages/apg-showcase/patterns/LinkPattern.tsx` (Trigger 1개)
4. `src/pages/apg-showcase/patterns/TablePattern.tsx` (Trigger 1개)
5. `src/inspector/panels/UnifiedInspector.tsx` (Trigger 1개)
6. `src/pages/focus-showcase/AriaInteractionTest.tsx` (Trigger 1개)
7. `src/pages/BuilderListPage.tsx` (Trigger 1개)

## 변환 명세표 (Migration Specification)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | AlertPattern.tsx | `<Trigger onActivate={SHOW_ALERT()}><button/></Trigger>` | `onClick={() => os.dispatch(SHOW_ALERT())}` (순수 React 이벤트 활용 권장) | 🟢 Clear | — | tsc 0 | 낮음 |
| 2 | ButtonPattern.tsx (1) | `<Trigger onActivate={PERFORM_ACTION()}><button/></Trigger>` | `onClick={() => os.dispatch(PERFORM_ACTION())}` | 🟢 Clear | — | tsc 0 | 낮음 |
| 3 | ButtonPattern.tsx (2) | `<Trigger onActivate={PERFORM_ACTION()}><div role="button"/></Trigger>` | `onClick={() => os.dispatch(PERFORM_ACTION())}` 및 onKeyDown 바인딩 (수동 ARIA 대응) | 🟢 Clear | — | tsc 0 | 낮음 |
| 4 | LinkPattern.tsx | `<Trigger onActivate={NAVIGATE...}><span/></Trigger>` | `onClick={() => os.dispatch(NAVIGATE...)}` | 🟢 Clear | — | tsc 0 | 낮음 |
| 5 | TablePattern.tsx | `<Trigger onActivate={SORT_BY_COLUMN(...)}><th/></Trigger>` | `onClick={() => os.dispatch(SORT_BY_COLUMN(...))}` | 🟢 Clear | — | tsc 0 | 낮음 |
| 6 | UnifiedInspector.tsx | `<Trigger id="scrollToBottomBtn"><button/></Trigger>` | `<button onClick={...}>` (내부 상태 제어용이라면 onClick으로 직접 제어 가능성 확인) | 🟢 Clear | — | tsc 0 | 낮음 |
| 7 | AriaInteractionTest.tsx | `<Trigger><button/></Trigger>` | 트리거 ID를 부여하는 Prop-getter 적용 가능성, অথবা `onClick` | 🟢 Clear | — | tsc 0 | 낮음 |
| 8 | BuilderListPage.tsx | `<Trigger><button/></Trigger>` | `onClick`을 통한 네비게이션 직접 디스패치 | 🟢 Clear | — | tsc 0 | 낮음 |

> **판단**: 현재 검사된 8곳은 OS App 파이프라인(`Zone.bind`)에 묶여있지 않은 **독립형 데모 뷰**이거나 **단순 버튼**입니다. 이 영역들에서 굳이 `<Trigger>` 컴포넌트를 쓸 이유가 애초에 약했습니다. (App 계층이 아닌 단순 컴포넌트 뷰 구성)
> 따라서 Prop-Getter(`createFunctionTrigger`) 형식을 쓸지, 혹은 아예 `os.dispatch(...)`를 직접 날릴지 결정해야 하는데, APG Showcase 등은 앱 구조가 아니라 순수 React Sandbox이므로 `os.dispatch(...)`를 직접 사용하는 `onClick` 모델이 가장 투명하고 간결합니다.

## MECE 점검
1. CE: 위 대상을 제거하면 Phase 1 후보군 내에서 발생하는 `<Trigger>` 종속성은 모두 제거된다.
2. ME: 중복은 없다. 대상 파일별로 격리된 마이그레이션.
3. No-op: Before와 After의 렌더링 방식이 완전히 달라지므로 변화는 분명하다.

## 라우팅
승인 후 → `/go` (action-centric-trigger 프로젝트의 Phase 1 마이그레이션 실행)
