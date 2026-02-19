
# Discussion: useComputed vs Zustand Selector

**Date**: 2026-02-20
**Participants**: User, AI (Antigravity)
**Topic**: React `useSyncExternalStore` crash causes and comparison with Zustand selectors.

## Journey

**🧑 사용자**: Maximum update depth exceeded 에러가 계속 나는데, 원인이 뭐야? 너 E2E로 확인 못해?

**🤖 AI**: (분석 및 수정 후) 원인은 `TodoApp`의 `selectVisibleTodos`가 매번 새로운 배열을 반환하기 때문입니다. `useComputed`가 내부적으로 `useSyncExternalStore`를 사용하는데, Selector 결과가 불안정(Unstable Reference)하면 React는 이를 무한 루프로 간주하고 크래시를 일으킵니다. 커널의 `useComputed`에 Memoization을 추가하여 해결했습니다.

**🧑 사용자**: useComputed와 zustand의 selector와는 뭐가 달라? @[/discussion]

**🤖 AI**: 핵심 차이는 **"결과 안정화(Result Stabilization)"** 여부입니다.

1.  **Zustand Selector (`useStore`)**:
    *   내부적으로 `useSyncExternalStoreWithSelector` (또는 유사 로직)를 사용합니다.
    *   Selector 실행 결과를 이전 값과 비교(Equality Check)합니다.
    *   참조가 달라도 내용(값)이 같으면 리렌더링을 막아줍니다.
    *   즉, 개발자가 `filter/map`을 남발해도 라이브러리가 수습해줍니다.

2.  **useComputed (Before Fix)**:
    *   React 18의 `useSyncExternalStore`를 날것(Raw)으로 사용했습니다.
    *   React가 스냅샷을 요청할 때마다 Selector를 실행하고 그 결과를 그대로 반환했습니다.
    *   Selector가 `[A]`(주소 1)를 반환하고, 재확인 시 `[A]`(주소 2)를 반환하면, React는 "데이터 불일치"로 판단하고 렌더링을 재시도하다가 루프에 빠집니다.

---

## Conclusion

### The "Amnesiac Selector" Problem
React 18의 Concurrent Rendering 모델에서 `useSyncExternalStore`를 사용할 때는 **getSnapshot 함수의 결과가 멱등성(Idempotency)과 참조 안정성(Referential Stability)**을 가져야 합니다.

- **문제**: Selector가 순수 함수라도, `map/filter`를 사용하면 호출 시마다 새로운 객체 참조를 반환합니다.
- **해결**: Hook 내부에서 **Memoization(캐싱)**을 구현해야 합니다.
  - State가 변경되지 않았다면 Selector를 실행하지 않고 이전 결과를 반환.
  - Selector 결과가 변경되었더라도, `Shallow Equal` 등을 통해 논리적으로 같다면 이전 참조를 반환.

### Kernel Update
`packages/kernel/src/createKernel.ts`의 `useComputed`는 이제 **Shallow Array Equality** 검사를 포함한 캐싱 로직을 내장합니다. 이는 Zustand의 기본 동작과 유사한 안전성을 제공합니다.

> **One Line Summary**: Zustand는 Selector의 결과를 메모이즈하여 React를 안심시키지만, 기존 `useComputed`는 매번 새로운 값을 던져 React를 패닉에 빠뜨렸다. 이제 `useComputed`도 똑똑해졌다.
