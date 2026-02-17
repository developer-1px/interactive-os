# 🐛 [Closed] Focus Playground — Maximum update depth exceeded
> 등록일: 2026-02-13
> 상태: closed
> 심각도: P1

## 원문
http://localhost:5173/playground/focus Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.

## 해석
`/playground/focus` 페이지에서 "Run All Tests" 클릭 시 `<TreeItems>` 컴포넌트에서 React 무한 업데이트 루프 발생.
- 기대 동작: 페이지가 정상 렌더링되고 테스트가 실행됨
- 실제 동작: `Maximum update depth exceeded` 에러로 크래시

## 첫 감
`useFocusExpansion` 훅의 `kernel.useComputed` 셀렉터에서 `?? []`가 매번 새로운 빈 배열 레퍼런스를 생성하여 `useSyncExternalStore`가 변경으로 감지 → 무한 리렌더.

## 관련 이슈
없음

## 해결 요약
- 원인: `useFocusExpansion` 훅의 selector `(s) => s.os.focus.zones[zoneId]?.expandedItems ?? []`에서 `?? []`이 매 호출마다 새로운 빈 배열 레퍼런스를 생성. `useSyncExternalStore`가 `===` 비교로 변경 감지 → 무한 리렌더.
- 수정: `useFocusExpansion.ts` — 모듈 레벨 `const EMPTY: readonly string[] = []` 추출, `?? EMPTY` 사용으로 참조 안정성 확보.
- 검증: smoke ✅ (12/12) / type ✅ / build ✅ / browser ✅
