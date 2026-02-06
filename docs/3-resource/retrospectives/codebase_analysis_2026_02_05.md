# Codebase Analysis & Retrospective (2026-02-05)

최근 진행된 코드베이스 리팩토링 및 기능 확장에 대한 'Pros & Cons' 분석 리포트입니다. 주로 **Core Architecture**, **Focus System**, **Navigation Logic**을 중점적으로 살펴보았습니다.

## 1. Core Architecture
### `App.tsx` & `useCommandListener.ts`

#### ✅ 훌륭한 점 (Well Done)
1.  **Safety Hook Pattern**: `useCommandListener`에서 `useLayoutEffect`와 `useRef`를 사용하여 리스너의 최신 상태를 유지하면서도 불필요한 재구독(Re-subscription)을 방지한 패턴은 React Hooks의 함정을 아주 잘 피해간 모범 사례입니다.
2.  **App Shell Separation**: `AppShell`(Context Provider)과 `AppContent`(Layout)를 분리함으로써, 애플리케이션의 "진입점"과 "구조" 관심사를 명확히 분리했습니다. 이는 추후 Provider 추가 시에도 `AppContent`의 렌더링 로직을 건드리지 않게 해줍니다.
3.  **Clean Dependency**: `App.tsx`가 거대해지는 것을 막기 위해 `Inspector` 관련 로직을 별도로 분리해낸 점은 유지보수성에 큰 도움이 됩니다.

#### ⚠️ 개선 포인트 (Areas for Improvement)
1.  **Type Safety (`any`)**: `useCommandListener`의 핸들러 payload가 `any`로 정의되어 있습니다.
    ```typescript
    handler: (payload: any) => void;
    ```
    커맨드 시스템이 커질수록 런타임 에러 위험이 증가하므로, `BaseCommand`에 제네릭을 도입하거나 `CommandMap` 타입을 정의하여 타입 추론을 강화할 필요가 있습니다.
2.  **Linear Scan Algorithm**: 현재 `useCommandListener`는 이벤트 발생 시 등록된 모든 리스너 배열을 순회(O(N))합니다. 리스너가 수백 개 이상으로 늘어날 경우, Map 구조(Event Type -> Handlers)로 변경하여 O(1) 조회로 최적화하는 것을 고려해야 합니다.

---

## 2. Focus System & State Management
### `sliceZone.ts` (Zone State)

#### ✅ 훌륭한 점 (Well Done)
1.  **Self-Healing State**: 아이템 삭제(`removeItem`) 시 단순히 제거만 하는 것이 아니라, `executeRecovery`를 통해 "다음에 포커스될 아이템"을 즉시 계산하고 복구하는 로직은 UX 품질을 결정짓는 매우 중요한 디테일입니다.
2.  **Immer Pattern**: Zustand와 Immer 패턴을 활용하여 불변성을 유지하면서도 직관적인 상태 업데이트를 구현했습니다.

#### ⚠️ 개선 포인트 (Areas for Improvement)
1.  **Implicit DOM Dependency**: Store(`sliceZone.ts`)는 원칙적으로 순수 데이터만 다뤄야 하지만, 복구 로직(`executeRecovery`)이나 Seamless 로직은 필연적으로 DOM(`getBoundingClientRect`)을 참조합니다. 현재는 구조적으로 잘 숨겨져 있으나, Store Action 내에서 DOM을 읽는 행위는 "Layout Thrashing"을 유발할 수 있으므로, 무거운 계산은 `requestAnimationFrame` 등으로 미루거나 별도 Worker/Middleware로 분리하는 패턴을 고민해볼 수 있습니다.

---

## 3. Navigation Pipeline & Seamless
### `focusPipeline.ts` & `handlerSeamless.ts`

#### ✅ 훌륭한 점 (Well Done)
1.  **Pipeline Architecture**: 내비게이션 로직을 단일 함수에 때려 넣지 않고, `AxisHandler`들의 배열로 파이프라인화(`runPipeline`)한 설계는 매우 훌륭합니다. 추후 '권한 체크', '로깅', '애니메이션 트리거' 등의 미들웨어를 손쉽게 추가할 수 있습니다.
2.  **Intelligent Heuristics**: `handlerSeamless`에서 단순히 거리만 재는 것이 아니라, 방향에 따라 "진입 엣지(Entry Edge)"를 필터링(예: 아래로 이동 시 타겟 존의 상단 엣지 아이템들만 후보군으로 선정)하는 로직은 사용자의 의도를 정확히 파악한 고급 구현입니다.

#### ⚠️ 개선 포인트 (Areas for Improvement)
1.  **Performance Risk (N+1 Query)**:
    `handlerSeamless.ts`의 `getSeamlessEntryItem` 함수를 보면:
    ```typescript
    for (const itemId of items) {
        const el = document.querySelector(`[data-item-id="${itemId}"]`); // ⚠️ SLOW
        itemRects.push({ ..., rect: el.getBoundingClientRect() }); // ⚠️ Reflow
    }
    ```
    타겟 존에 아이템이 50개만 있어도 50번의 DOM 쿼리와 리플로우 계산이 발생합니다. 이는 빠른 키보드 연타 시 프레임 드랍의 주범이 될 수 있습니다.
    **제안**: `targetZoneElement.querySelectorAll('[data-item-id]')`로 한 번에 가져오거나, `IntersectionObserver` 등을 활용해 가시 영역의 아이템만 계산하도록 최적화가 필요합니다.

---

## 4. Summary
전반적으로 "동작하는 코드"를 넘어 **"확장 가능하고 견고한 아키텍처"**를 지향하고 있음이 보입니다. 특히 Focus System의 복구(Recovery) 전략과 파이프라인 설계는 상용 수준의 복잡도를 다루기에 충분한 구조입니다. 다만, Seamless Navigation 등에서 발생할 수 있는 DOM 관련 성능 이슈만 선제적으로 최적화한다면 더욱 완성도 높은 OS가 될 것입니다.
