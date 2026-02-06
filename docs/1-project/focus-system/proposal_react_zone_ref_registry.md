# Proposal: React-Managed Zone & Spatial Registry

## 1. Problem Statement
현재 `Focus System`의 Spatial Navigation(Seamless, Recovery) 구현은 `document.querySelector`와 `getElementById`에 크게 의존하고 있습니다. 이는 다음과 같은 문제를 야기합니다.

*   **Performance Bottleneck**: 키보드 입력 시마다 전체 DOM 트리를 탐색(O(N))하여 엘리먼트를 찾습니다. 아이템이 많아질수록 레이턴시가 증가합니다.
*   **Encapsulation Violation**: React의 라이프사이클과 무관하게 DOM에 직접 접근하므로, "Unmounted" 된 컴포넌트에 접근하거나, Shadow DOM 도입 시 깨질 위험이 있습니다.
*   **Fragility**: HTML Attribute(`data-zone-id`, `data-item-id`) 오타 하나로 시스템 전체가 오동작 할 수 있습니다.

## 2. Proposed Solution: `DOMInterface` Registry
React의 `Ref` 시스템을 활용하여, 컴포넌트가 마운트되는 시점에 자신의 DOM 참조를 중앙 레지스트리에 등록하는 패턴을 제안합니다.

### 2.1. Architecture Overview

```mermaid
graph TD
    Z[Zone Component] -->|useRef + Effect| DR[DOM Registry]
    I[Item Component] -->|useRef + Effect| DR
    DR -->|Map<ID, HTMLElement>| SH[Seamless Handler]
    DR -->|Map<ID, HTMLElement>| RH[Recovery Handler]
    RH -->|getRect()| DR
```

DOM 탐색을 **O(N) Search**에서 **O(1) Map Lookup**으로 변경합니다.

### 2.2. Implementation Details

#### A. The Registry (Singleton/Store)
Zustand Store와 별개로, Reference만 관리하는 가벼운 모듈을 만듭니다. (Zustand에 넣으면 Ref 변경 시마다 불필요한 리렌더링이 발생할 수 있음)

```typescript
// @os/features/focus/lib/DOMInterface.ts
class DOMRegistry {
  private zones = new Map<string, HTMLElement>();
  private items = new Map<string, HTMLElement>();

  registerZone(id: string, el: HTMLElement) {
    this.zones.set(id, el);
  }

  unregisterZone(id: string) {
    this.zones.delete(id);
  }

  getZoneRect(id: string): DOMRect | null {
    return this.zones.get(id)?.getBoundingClientRect() ?? null;
  }
  
  // ... items methods
}

export const DOMInterface = new DOMRegistry();
```

#### B. Component Integration (`Zone.tsx`)
`Zone` 컴포넌트가 마운트될 때 자신을 등록합니다.

```typescript
// Zone.tsx
import { DOMInterface } from "@os/features/focus/lib/DOMInterface";

export function Zone({ id, ...props }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      DOMInterface.registerZone(id, containerRef.current);
    }
    return () => DOMInterface.unregisterZone(id);
  }, [id]);

  return <div ref={containerRef} {...props} />;
}
```

#### C. Handler Update (`handlerSeamless.ts`)
기존의 `querySelector` 로직을 교체합니다.

```typescript
// Before
const el = document.querySelector(`[data-zone-id="${currentZoneId}"]`);

// After
const rect = DOMInterface.getZoneRect(currentZoneId);
```

## 3. Benefits (Pros)
1.  **High Performance**: DOM 쿼리 오버헤드가 완전히 제거됩니다. (O(N) -> O(1))
2.  **Explicit Ownership**: React 컴포넌트 생명주기와 정확히 일치하게 동작합니다. 언마운트된 존은 레지스트리에서 즉시 사라지므로 "Zombie Focus" 문제가 해결됩니다.
3.  **Clean Code**: 비즈니스 로직에서 `document.querySelector` 같은 저수준 API가 사라지고, `DOMInterface.getRect()` 같은 추상화된 API를 사용합니다.

## 4. Drawbacks & Mitigation (Cons)
1.  **Memory Management**: 레지스트리 해제를 누락할 경우 메모리 누수가 발생할 수 있습니다 (WeakRef 고려 가능하나, React Effect cleanup으로도 충분).
2.  **Concurrency**: React `render`와 `commit` 사이의 미세한 타이밍 이슈가 있을 수 있으나, `useLayoutEffect`를 사용하면 동기적으로 처리되므로 안전합니다.

## 5. Decision Needed
이 "Ref Registry 패턴" 도입을 진행하시겠습니까? 승인 시 다음 작업을 진행합니다:
1.  `DOMInterface.ts` 구현
2.  `Zone.tsx`, `Item.tsx`에 등록 로직 추가
3.  `handlerSeamless`, `handlerRecovery` 리팩토링
