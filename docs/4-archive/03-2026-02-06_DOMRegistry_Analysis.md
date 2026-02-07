# DOMRegistry 필요성 분석

## 1. 개요 (Overview)

**질문**: DOM 기반 아키텍처에서 DOMRegistry가 정말 필요한가?

DOM 자체가 source of truth라면, 왜 별도의 JavaScript Map에 element 참조를 저장해야 하는가?

---

## 2. 현황 분석 (Current State)

### DOMRegistry가 하는 일
```typescript
const groupElements = new Map<string, HTMLElement>();
const itemElements = new Map<string, HTMLElement>();

DOMRegistry.registerGroup(groupId, element);
DOMRegistry.getGroup(groupId);
DOMRegistry.getGroupItems(groupId); // DOM 쿼리
```

### 사용처 (26개 참조)
| 파일 | 용도 |
|------|------|
| `FocusGroup.tsx` | 등록/해제 |
| `FocusItem.tsx` | 등록/해제 |
| `FocusSync.tsx` | element 조회 → `focus()` 호출 |
| `navigate.ts` | items 조회, rect 계산 |
| `select.ts`, `tab.ts` | items 조회 |
| `navigatorRegistry.ts` | spatial navigation |

---

## 3. Red Team: DOMRegistry는 불필요하다 🔴

### 논거

**1. DOM 쿼리로 대체 가능**
```typescript
// 현재
const el = DOMRegistry.getGroup(groupId);

// 대안
const el = document.querySelector(`[data-focus-group="${groupId}"]`);
```

**2. 생명주기 관리가 중복**
- React가 이미 mount/unmount를 관리
- DOMRegistry.register/unregister는 단순 미러링
- DOM에 element가 없으면 = 해제된 것

**3. 불일치 위험**
- DOM에는 있는데 Registry에는 없는 경우
- Registry에는 있는데 DOM에서는 제거된 경우
- 두 source of truth가 drift할 수 있음

**4. `getGroupItems()`는 이미 DOM 쿼리**
```typescript
getGroupItems(groupId: string): string[] {
    const container = groupElements.get(groupId);
    const elements = container.querySelectorAll('[data-item-id]');
    // ⬆️ 결국 DOM 쿼리를 하고 있음!
}
```

### 결론
Map은 단순히 `document.getElementById` 캐시일 뿐. DOM이 source of truth라면 캐시는 버그의 원인이 될 뿐.

---

## 4. Blue Team: DOMRegistry는 필요하다 🔵

### 논거

**1. 성능: O(1) vs O(n)**
```typescript
// Map lookup: O(1)
DOMRegistry.getItem(itemId);

// DOM query: O(n) - 전체 DOM 탐색
document.querySelector(`[data-item-id="${itemId}"]`);
```

- Navigation은 매 keydown마다 발생 (초당 수십 회 가능)
- 많은 아이템이 있는 리스트에서 DOM query는 병목

**2. Scope 보장**
```typescript
// DOMRegistry - 특정 group 내에서만 검색
const container = groupElements.get(groupId);
container.querySelectorAll('[data-item-id]');

// 전역 쿼리 - 다른 group의 아이템도 찾을 위험
document.querySelectorAll('[data-item-id]');
```

**3. WeakMap 대신 Map을 쓰는 이유**
- WeakMap은 key 순회 불가 (`getAllGroups()` 구현 불가)
- Spatial navigation은 모든 group rect을 비교해야 함

**4. Semantic Clarity**
- `DOMRegistry.getItem(id)` → 의도가 명확
- `document.querySelector(...)` → DOM 구조 의존

### 결론
성능과 scope 보장을 위해 캐시 레이어가 필요함.

---

## 5. 중재안: Hybrid Approach 🟢

### 분석
| 기능 | Registry 필요? | 이유 |
|------|----------------|------|
| `getGroup(id)` | ⚠️ 미약 | `getElementById`도 빠름 |
| `getItem(id)` | ⚠️ 미약 | 동일 |
| `getGroupItems(groupId)` | ✅ 필요 | scope 제한 + 순서 보장 |
| `getAllGroupRects()` | ✅ 필요 | 모든 group 순회 필요 |

### 제안: Lazy Registry
```typescript
// 등록/해제 없이, 필요할 때만 DOM 쿼리 + 캐시
const DOMCache = {
    getGroup(id: string): HTMLElement | null {
        return document.getElementById(id);
    },
    
    getGroupItems(groupId: string): string[] {
        const container = document.getElementById(groupId);
        if (!container) return [];
        return Array.from(container.querySelectorAll('[data-item-id]'))
            .map(el => el.getAttribute('data-item-id')!);
    }
};
```

**장점:**
- 등록/해제 코드 제거 (FocusGroup, FocusItem 단순화)
- 불일치 불가능
- 필요 시 캐시 레이어 추가 가능

**단점:**
- 성능 측정 필요 (실제로 병목인지?)

---

## 6. 결론 및 제안 (Conclusion)

### 현실적 권고

1. **Item Registry는 제거 고려**
   - `getItem(id)` → `document.getElementById(id)`로 대체
   - FocusItem에서 register/unregister 삭제

2. **Group Registry는 유지**
   - `getAllGroups()`, `getAllGroupRects()` 기능 필요
   - Spatial navigation에서 모든 group 순회 필수

3. **성능 벤치마크 선행**
   - 1000개 아이템 리스트에서 navigation 성능 측정
   - DOM query가 실제로 병목인지 확인 후 결정

### 다음 액션
- [ ] 성능 벤치마크 수행
- [ ] Item 등록/해제 제거 실험
- [ ] 결과에 따라 아키텍처 결정
