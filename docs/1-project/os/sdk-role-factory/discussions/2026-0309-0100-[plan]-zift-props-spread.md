# Plan: ZIFT Props Spread Redesign

> 생성일: 2026-03-09 01:00
> 기원: /discussion → /blueprint → /plan
> 관련: `docs/0-inbox/2026-0309-0045-[blueprint]-zift-props-spread-redesign.md`

## 변환 명세표

### Phase A: Focus Effect 주 경로 전환 (Critical Path — Item 제거의 선행 조건)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| A1 | `os-core/4-command/navigate/index.ts:223` | `return { state, scroll: targetId }` — focus effect 없음 | `return { state, scroll: targetId, focus: targetId }` — focus effect 추가 | Clear | — | 기존 navigate 테스트 pass + focus 이동 확인 | navigate는 가장 빈번한 command. 이중 focus(effect + Item useLayoutEffect) 잠시 공존 |
| A2 | `os-core/4-command/focus/focus.ts` | `OS_FOCUS` — state만 변경, focus effect 없음 | `return { state, focus: payload.itemId }` | Clear | — | OS_FOCUS 테스트 pass | overlay autoFocus 경로에서 사용됨 |
| A3 | `os-core/4-command/tab/tab.ts` | `OS_TAB` — state만 변경 | zone 전환 시 `focus: targetItemId` effect 추가 | Clear | — | Tab 키 zone 전환 테스트 | Tab은 zone간 이동 — targetZone의 첫 아이템 focus |
| A4 | `os-core/4-command/overlay/overlay.ts` | `OS_OVERLAY_OPEN/CLOSE` — state만 변경 (triggerFocus는 별도 effect) | OPEN: `focus: firstItem` effect 추가. CLOSE: 기존 triggerFocus 유지 | Clear | — | overlay 테스트 pass | autoFocus 로직이 Zone.tsx에도 있음 — 중복 제거 필요 |
| A5 | `os-core/4-command/focus/syncFocus.ts` | `OS_SYNC_FOCUS` — state만 변경, 주석: "NO focus effect — prevents loop" | **변경 없음** — syncFocus는 DOM→state 동기화이므로 focus effect 반환하면 무한 루프 | Clear | — | — | 이 command는 예외 — effect 추가하면 안 됨 |
| A6 | `os-core/4-command/field/startEdit.ts` | `OS_FIELD_START_EDIT` — editingItemId 설정 | focus effect 불필요 — Field.tsx의 useFieldFocus가 DOM focus 담당 (DOM이 진실인 영역) | Clear | — | — | Field는 DOM lifecycle 유지 |
| A7 | `os-core/4-command/dismiss/escape.ts` | `OS_ESCAPE` — overlay close 또는 selection clear | overlay close는 A4에서 처리. selection clear 시 focus는 유지되므로 effect 불필요 | Clear | A4 | — | — |
| A8 | `os-core/5-effect/index.ts:14-19` | 주석: "Normal focus transitions are handled by FocusItem.useLayoutEffect" | 주석 수정: "Focus transitions are handled by this effect (returned from commands)" | Clear | A1~A4 | — | 문서/주석만 변경 |

### Phase B: 새 API 구현

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| B1 | `os-sdk/app/defineApp/types.ts:BoundComponents` | `Zone: FC`, `Item: FC`, `Field: FC`, `When: FC` | 기존 유지 + `useItem: (id) => ItemAttrs`, `container: ContainerProps`, `item: (id) => ItemAttrs` 추가 | Clear | — | tsc 0 | BoundComponents 타입 확장 (비파괴적) |
| B2 | `os-sdk/app/defineApp/bind.ts:createBoundComponents` | Zone/Item/Field/When 컴포넌트만 반환 | + `useItem(id)` hook 반환: 내부에서 `useSyncExternalStore(os.subscribe, () => computeItem(os, id, zoneId))` | Clear | B1 | tsc 0 + useItem hook 테스트 | `os.subscribe` 존재 여부 확인 필요 |
| B3 | `os-sdk/app/defineApp/bind.ts` | container props 없음 | + `container` getter: `computeContainerProps(zoneName, config, isActive, role)` — isActive는 `os.useComputed` 필요 → 별도 `useContainer()` hook | Complicated | B1 | tsc 0 | container가 isActive를 구독해야 함 → 순수 props 불가, hook 필요. **제 판단: `useContainer()` hook으로.** |
| B4 | `os-sdk/app/defineApp/bind.ts` | item 순수 함수 없음 | + `item(id)` 순수 함수: `computeItem(os, id, zoneId).attrs` — 구독 없음, 호출 시점 스냅샷 | Clear | B1 | tsc 0 | headless 테스트 / 유틸 전용. stale 경고 문서화 |

### Phase C: Item.tsx Focus Effect 제거

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| C1 | `os-react/6-project/Item.tsx:114-121` | `useLayoutEffect → el.focus()` (주 경로) | 제거 — 5-effect가 주 경로로 승격됨 | Clear | A1~A4 완료 확인 | **전체 headless 테스트 pass + 브라우저 focus 동작 확인** | 가장 위험한 단계. A phase 완료 후에만 실행. rollback 준비 |

### Phase D: 호환 레이어 + 마이그레이션

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| D1 | `os-sdk/app/defineApp/bind.ts:ItemComponent` | `<Item>` React FC (기존) | 내부적으로 `useItem(id)` 호출하는 wrapper로 유지. **외부 API 변경 없음** | Clear | B2 | 기존 전체 테스트 pass | 기존 `<UI.Item>` 사용 코드 52파일이 깨지지 않음 |
| D2 | `os-sdk/app/defineApp/bind.ts:ZoneComponent` | `<Zone>` React FC (기존) | 내부적으로 `useContainer()` 호출하는 wrapper로 유지. **외부 API 변경 없음** | Clear | B3 | 기존 전체 테스트 pass | 기존 `<UI.Zone>` 사용 코드가 깨지지 않음 |
| D3 | 앱/showcase 52파일 | `<UI.Item>`, `<UI.Zone>` 사용 | **Phase D에서는 변경 없음** — 호환 레이어가 보호. 점진적 마이그레이션은 별도 프로젝트 | Clear | D1, D2 | — | 마이그레이션은 이 프로젝트 범위 밖 |

---

## MECE 점검

1. **CE**: A1~A4(focus effect) + B1~B4(새 API) + C1(Item effect 제거) + D1~D2(호환) = 목표 달성? → **YES** — navigate→focus effect가 주 경로, 새 API 제공, 기존 코드 보호
2. **ME**: 중복 행? → A5~A7은 **변경 없음** 확인 — 제거 가능하지만 "왜 안 하는지" 기록 가치가 있으므로 유지
3. **No-op**: Before=After? → A5(syncFocus), A6(field), A7(escape)는 의도적 No-op (예외 사유 기록)

## B3 Complicated 해소

**문제**: `zone.container`가 순수 props가 될 수 없다. `isActive` (현재 active zone인지)를 구독해야 해서 hook이 필요.

**제 판단**: `useContainer()` hook으로 변경. 이유: `isActive`는 zone 전환마다 바뀌므로 구독 필수. 순수 props로 하면 stale.

```tsx
// 최종 API
const { container, useItem, item, Field, When } = zone.bind(config);

// 사용
function TodoList() {
  const containerProps = container.useProps(); // hook — isActive 구독
  return (
    <div {...containerProps}>
      {todos.map(todo => <TodoItem key={todo.id} id={todo.id} />)}
    </div>
  );
}

function TodoItem({ id }) {
  return <div {...useItem(id)}>{...}</div>; // hook — per-item 구독
}
```

→ B3 Cynefin: **Clear로 갱신.**

## 실행 순서

```
A1→A2→A3→A4 (focus effect 추가, 병렬 가능)
  ↓
A8 (주석 수정)
  ↓
B1→B2→B3→B4 (새 API, A와 병렬 가능)
  ↓
C1 (Item effect 제거 — A 완료 후)
  ↓
D1→D2 (호환 레이어)
  ↓
전체 검증: tsc 0 + vitest + regression 0
```

**총 변경 파일: ~15파일 (framework)**. 앱 코드 52파일은 호환 레이어로 보호 — 변경 0.

## 라우팅

승인 후 → `/project` (새 프로젝트) — os-core 도메인, `zift-props-spread` 프로젝트
