# Plan: Trigger Action-centric Spread 변환 명세

## 개요
- 목표: ZIFT Pipeline의 Trigger를 컴포넌트 래퍼(`Trigger.tsx`, `<Trigger asChild>`) 방식에서 순수 변환 함수(`zone.triggers.xxx()`)로 전환한다.
- 사상: Action-centric Event Delegation. 개별 DOM 노드에서 `onClick`과 같은 React 이벤트를 완전히 배제하고, 오직 식별 속성(`data-trigger-id`, `aria-*`)만 반환하여 `...spread`로 주입한다. 이벤트를 캡처하는 주체는 `PointerListener`가 된다.

---

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `defineApp/types.ts` <br/>`ZoneHandle` | `trigger(id, onActivate): TriggerBinding & React.FC` | `trigger(id, onActivate): TriggerBinding & (<T extends HTMLElement>() => React.HTMLAttributes<T>)` | Clear | — | `tsc 0` | 사용자 코드 전체 변경 |
| 2 | `defineApp/trigger.ts` <br/>`createFunctionTrigger` | `React.createElement(Trigger, ...)` | `{ 'data-trigger-id': id, role, ...ariaProps }` 형태의 객체 반환 함수로 교체. (컴포넌트 반환이 아님) | Clear | →#1 | `tsc 0` | — |
| 3 | `os-react/src/6-project/trigger/TriggerBase.tsx` | `TriggerBase` 컴포넌트 존재. `onActivate` 등록을 `useEffect`로 수행하고, 자식 요소에 이벤트를 merge함 | 삭제 또는 내부 로직을 `TriggerRegistry` 등록용 유틸과 속성 계산 유틸로 분리 투영 (컴포넌트 폐기) | Clear | →#2 | `tsc 0` | Layer 1 프레젠테이션 깨짐 유의 |
| 4 | `os-react/src/6-project/trigger/index.ts` | `TriggerBase`, `TriggerPortal` 등 병합 내보내기 | Trigger 뷰 연관된 컴포넌트(`Portal`, `Popover`, `Dismiss`)만 남기고 베이스 컴포넌트 제거 (혹은 네임스페이스 재구성) | Clear | →#3 | `tsc 0` | — |
| 5 | `PointerListener.tsx` <br/>`senseClickTarget` | `triggerEl.getAttribute("data-trigger-id")` 활용 중 | 상태 머신과 리스너 로직은 이미 글로벌 위임(Delegation)을 지원하고 있음. 변경 최소화(추가 동작 확인) | Clear | — | 로직 유지 | 버블링 중단 누락 가능성 |

## 해설 및 라우팅
이 변경 사항은 ZIFT 컴포넌트를 소비하는 모든 최상단 애플리케이션에 Breaking Change를 유발합니다. 
그러나 이는 OS가 진정한 "Zero-Drift" 및 "Passive Projection"을 달성하기 위한 마지막 관문입니다. 기존에는 React 생태계 관성을 벗어나지 못해 Trigger 래퍼를 유지하고 이벤트 핸들러를 내려줬으나, 이젠 그럴 필요가 없다는 사실이 증명되었습니다.

## 라우팅
승인 후 → `/go` (action-centric-trigger) — OS Core T1 태스크 진입
