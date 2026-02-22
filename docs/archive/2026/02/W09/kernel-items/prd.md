# PRD — Kernel Items: Zone Item Registry in Kernel State

> Zone이 자기 자식을 알아야 OS가 포커스를 보장한다.
> DOM은 형태(geometry)를 제공하고, State는 구조(structure)를 제공한다.

## 1. 문제 정의

### 1.1 현재 아키텍처

```
아이템 소스:
  프로덕션: DOM querySelectorAll("[data-item-id]")  ← 레거시
  headless:  mockItems (수동 주입)                    ← 우회

소비자:
  OS_NAVIGATE  → ctx.inject(DOM_ITEMS) → items: string[]
  OS_DELETE    → ctx.inject(DOM_ITEMS) → items: string[]
  OS_SELECT    → ctx.inject(DOM_ITEMS) → items: string[]
  applyFocusPop → ❌ 아이템 목록 접근 불가
```

### 1.2 발생하는 문제

| # | 문제 | 근본 원인 |
|---|------|----------|
| P1 | 오버레이 pop 후 삭제된 아이템으로 포커스 복원 | `applyFocusPop`이 아이템 존재 확인 불가 |
| P2 | `confirmDeleteTodo` 4-command 수동 오케스트레이션 | OS가 자동 복구 불가 → 앱이 대신 |
| P3 | headless 테스트에서 `setItems` mock 필요 | 진짜 아이템 소스가 DOM이므로 |
| P4 | 필터/undo 후 stale focus 미처리 | 범용 stale 감지 메커니즘 부재 |

## 2. 목표 아키텍처

```
아이템 소스:
  kernel state: os.focus.zones[zoneId].items: string[]  ← single source of truth

등록 메커니즘:
  FocusItem mount → ITEM_REGISTER(zoneId, itemId)
  FocusItem unmount → ITEM_UNREGISTER(zoneId, itemId)
  (또는 앱 state 파생 → Zone config의 items accessor)

소비자:
  OS_NAVIGATE  → state.os.focus.zones[zoneId].items
  OS_DELETE    → state.os.focus.zones[zoneId].items
  OS_SELECT    → state.os.focus.zones[zoneId].items
  applyFocusPop → state.os.focus.zones[zoneId].items  ← ✅ 이제 가능
```

### 2.1 DOM의 역할 축소

| 정보 | 소스 | 이유 |
|------|------|------|
| 아이템 목록 (구조) | **kernel state** | headless 동작, stale 감지 |
| 아이템 위치 (기하) | **DOM** (DOMRect) | geometry는 DOM 고유 |
| 확장/트리 레벨 | **kernel state** (향후) | headless 동작 |

## 3. 기능 요구사항

### FR1: Zone Item Registry

- Zone의 kernel state에 `items: string[]` (ordered) 필드 추가
- 아이템 등록/해제 시 이 필드가 갱신됨
- 순서는 DOM 순서 또는 앱 상태 순서를 반영

### FR2: Stale Focus Auto-Recovery

- `focusedItemId`가 `items`에 없으면 자동으로 이웃(next → prev → null)으로 이동
- 적용 시점: `applyFocusPop`, 그리고 items 변경 시마다 (범용)
- applyFocusPop만이 아니라, **아이템 목록이 변경될 때마다** focusedItemId를 검증

### FR3: DOM_ITEMS 마이그레이션

- `ctx.inject(DOM_ITEMS)` → `state.os.focus.zones[zoneId].items` 전환
- `DOM_ITEMS` context provider는 deprecated → 제거
- `DOM_RECTS`는 유지 (geometry는 DOM 고유)

### FR4: createOsPage 전환

- `setItems()`가 mock이 아니라 실제 kernel state의 items를 설정
- 또는 items가 앱 state에서 파생되면 setItems 자체가 불필요해짐

### FR5: 앱 코드 간소화

- `confirmDeleteTodo`에서 `OS_FOCUS`, `OS_SELECTION_CLEAR` 제거 가능
- 앱은 `OS_OVERLAY_CLOSE` + 상태 변경만 하면 OS가 자동 복구

## 4. 열린 설계 질문

### Q1: 아이템 등록 메커니즘

| 방식 | 장점 | 단점 |
|------|------|------|
| **A. Component mount/unmount** | 현재 FocusItem 패턴과 자연스럽게 통합 | React 렌더 의존, 타이밍 문제 |
| **B. 앱 state 파생** | 앱이 items accessor 제공, OS가 state 변경 감지 | Zone config에 accessor 추가 필요 |
| **C. 명시적 커맨드** | `ITEM_REGISTER`/`ITEM_UNREGISTER` 커맨드 | 앱이 직접 호출해야 — 누락 위험 |

→ Discussion에서 결정 필요

### Q2: 순서 보장

DOM 순서와 앱 상태 순서가 다를 수 있는가? (e.g., CSS로 시각적 순서 변경)
→ 현재 DOM_ITEMS가 DOM 순서를 반환하므로, state 기반으로 가면 앱 상태 순서가 됨. APG는 "logical order"를 요구 — 앱 상태 순서가 logical order와 일치한다면 문제 없음.

### Q3: 범용 stale 감지 시점

items가 변경될 때마다 focusedItemId를 체크하면 성능 영향은?
→ items 변경은 드문 이벤트 (삭제, 추가, 필터) — O(n) 체크는 무시 가능.

## 5. 완료 조건

- [ ] `DOM_ITEMS` context provider 제거
- [ ] kernel state에 zone items 존재
- [ ] `applyFocusPop`이 stale focusedItemId 자동 resolve
- [ ] `confirmDeleteTodo`에서 `OS_FOCUS` 제거 가능
- [ ] headless navigate 테스트에서 `setItems` mock이 실제 state 설정
- [ ] overlay+delete 합성 시나리오 headless 테스트 통과
- [ ] 기존 테스트 regression 없음
