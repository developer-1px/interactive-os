# Blueprint: DOM Context Elimination — 최종 구조

> kernel-items 프로젝트의 완성. DOM에서 구조 정보를 읽는 모든 레거시 패턴을 제거하고,
> OS가 state만으로 동작하는 최종 구조를 만든다.

## 1. Goal

**Done Criteria**: 프로덕션 코드에서 `querySelectorAll`으로 구조 정보를 역추적하는 패턴이 0개.

UDE (Undesirable Effects):
- UDE-1: `DOM_ITEMS` — item 목록을 DOM에서 역추적 (`querySelectorAll("[data-item-id"]`)
- UDE-2: `DOM_EXPANDABLE_ITEMS` — expandable 여부를 DOM attribute에서 역추적
- UDE-3: `DOM_TREE_LEVELS` — tree level을 DOM attribute에서 역추적
- UDE-4: `DOM_ZONE_ORDER` — zone 순서를 DOM에서 역추적
- UDE-5: `collection.remove` / `cut` — 60행의 수동 neighbor 계산 + OS_FOCUS dispatch
- UDE-6: `DOM_RECTS` — 기하 정보를 DOM에서 읽음 (이건 headless 불가)

## 2. Why

**근본 원칙 위반**: Headless Principle.
- OS는 DOM 없이 동작할 수 있어야 한다.
- 현재 headless 테스트는 5개 context를 모두 mock → 프로덕션 코드와 테스트 코드가 다른 경로를 탄다.
- mock이 실제 DOM 동작과 다를 때 → 테스트 통과하지만 프로덕션 버그.

**기술 부채**: 동일 패턴의 코드 중복 (remove 20행, cut 40행, confirmDeleteTodo 8행 → 68행).

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| DOM_RECTS도 state에서 파생 가능 | ❌ **아님** — 기하 정보는 렌더링 결과. 브라우저만 알 수 있음 | DOM_RECTS는 유일하게 DOM 읽기가 정당한 context. 유지. |
| DOM_ZONE_ORDER는 ZoneRegistry 순서로 대체 가능 | ⚠️ **부분적** — register 순서 ≠ 시각적 순서 (Portal 등) | register 시 order hint 추가, 또는 ZONE_ORDER를 app에서 선언 |
| remove/cut의 focus recovery를 applyFocusPop으로 통합 가능 | ❌ **아님** — remove는 stack pop 없이 직접 삭제. 다른 트리거 포인트 필요 | **delete 후 자동 resolve를 별도 메커니즘으로** |
| 모든 collection이 getItems를 제공 | ✅ 맞음 — ops.getItems는 이미 존재 | collectionBindings에서 자동 전달 (✅ 완료) |

### 핵심 발견

- **DOM_RECTS는 레거시가 아니다** — 기하 정보는 DOM의 정당한 관할. 유지.
- **DOM_ZONE_ORDER는 전환 가능하지만 복잡** — Portal 시나리오 해결 필요. 위험 대비 효용 낮음.
- **remove/cut 포커스 복구는 applyFocusPop과 다른 메커니즘** — "삭제 command의 return에서 자동으로 neighbor focus를 생성"하는 미들웨어/유틸 필요.

## 4. Ideal

### 삭제 후 포커스 (remove/cut)

```typescript
// Before (60행 수동 오케스트레이션)
const remove = zone.command("remove", (ctx, { id }) => {
  const neighbor = ... // 20행 neighbor 계산
  return {
    state: produce(...),
    dispatch: OS_FOCUS({ itemId: neighbor }), // 수동 dispatch
  };
});

// After (0행 — OS가 자동 처리)
const remove = zone.command("remove", (ctx, { id }) => {
  return {
    state: produce(ctx.state, draft => {
      ops.removeItem(draft, id);
    }),
    // OS가 focusedItemId 기반으로 자동 resolve
  };
});
```

### DOM_EXPANDABLE_ITEMS → Zone accessor

```typescript
// Before: DOM querySelectorAll
const expandableIds = new Set();
entry.element.querySelectorAll("[data-item-id][aria-expanded]")...

// After: Zone state accessor
ZoneEntry.getExpandableItems?: () => Set<string>
```

### DOM_TREE_LEVELS → Zone accessor

```typescript
// Before: DOM attribute 역추적
el.getAttribute("aria-level")

// After: Zone state accessor
ZoneEntry.getTreeLevels?: () => Map<string, number>
```

## 5. Inputs

- `2-contexts/index.ts` — 6개 DOM context 정의
- `2-contexts/zoneRegistry.ts` — ZoneEntry 인터페이스 (getItems 추가됨 ✅)
- `collection/createCollectionZone.ts` — remove, cut command
- `3-commands/focus/focusStackOps.ts` — resolveItemFallback (✅ 완료)
- `6-components/base/FocusGroup.tsx` — Zone 등록
- `6-components/primitives/Zone.tsx` — Zone facade
- `defineApp.bind.ts` — createBoundComponents
- `defineApp.page.ts` — createAppPage (headless)
- `createOsPage.ts` — OS-level headless
- `3-commands/navigate/index.ts` — OS_NAVIGATE (DOM_ITEMS inject)

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | remove/cut이 OS_FOCUS 없이 동작 | 수동 neighbor 계산 + OS_FOCUS | **focusedItemId auto-resolve** after state mutation | High | — |
| G2 | DOM_ITEMS → getItems accessor | DOM querySelectorAll | **OS_NAVIGATE가 getItems 사용** | High | getItems ✅ |
| G3 | DOM_EXPANDABLE_ITEMS → accessor | DOM querySelectorAll | **getExpandableItems on ZoneEntry** | Med | — |
| G4 | DOM_TREE_LEVELS → accessor | DOM querySelectorAll | **getTreeLevels on ZoneEntry** | Med | — |
| G5 | DOM_ZONE_ORDER → registry 기반 | document.querySelectorAll | **ZoneRegistry order tracking** | Low | — |
| G6 | headless mock 정리 | 5개 context mock | **mock → accessor 전환 완료 시 제거** | Med | G2-G5 |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| E1 | **focusedItemId auto-resolve** | Complicated | — | state mutation 후 focusedItemId가 items에 없으면 자동 neighbor resolve. remove/cut에서 OS_FOCUS 제거. |
| E2 | **OS_NAVIGATE getItems 전환** | Clear | getItems ✅ | `ctx.inject(DOM_ITEMS)` → `ZoneRegistry.get(zoneId)?.getItems?.()` + DOM_ITEMS fallback |
| E3 | **getExpandableItems accessor** | Clear | — | ZoneEntry에 추가. FocusGroup → Zone → bind 체인 관통. DOM_EXPANDABLE_ITEMS에서 accessor 우선 사용. |
| E4 | **getTreeLevels accessor** | Clear | — | 위와 동일 패턴. DOM_TREE_LEVELS에서 accessor 우선 사용. |
| E5 | **DOM_ZONE_ORDER 전환** | Complicated | — | ZoneRegistry에 등록 순서 tracking 추가. DOM 접근 제거. |
| E6 | **headless mock 정리** | Clear | E2-E5 | createOsPage / defineApp.page에서 불필요한 mock 제거 |

### 실행 순서

```
E1 (포커스 자동화) → E2 (Navigate) → E3+E4 (병렬) → E5 → E6
```

E1이 가장 임팩트 높고 (60행 제거), E2-E4는 기계적 전환, E5는 가장 다루기 까다로움.
