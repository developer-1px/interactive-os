# Zone/FocusGroup 책임 분리

- Feature Name: `zone-focusgroup-separation`
- Start Date: 2026-02-23

## Summary

Zone(합성점)과 FocusGroup(APG 기능 모듈)의 책임을 분리한다. Zone이 DOM 관할, Registry 등록, state 초기화를 소유하고, FocusGroup은 headless APG capability로 축소한다. asChild를 기본으로 하여 DOM 소유권을 앱에게 완전히 넘긴다.

## Motivation

### 현재 문제

1. **FocusGroup이 Zone의 일을 대행**: div 렌더링, `ZoneRegistry.register()`, `FOCUS_GROUP_INIT` → ZoneState 초기화가 모두 FocusGroup.tsx 안에 있다.
2. **이름 혼란**: 같은 개념에 Zone/FocusGroup/group 3개 이름이 공존. `FOCUS_GROUP_INIT` 커맨드의 변수명은 `INIT_ZONE`이지만 커맨드명은 `FOCUS_GROUP_INIT`. grep 한 번에 전체가 안 보인다.
3. **확장 불가**: DnD, Resize, FileUpload 등 두 번째 기능 모듈이 오면 FocusGroup에 끼워넣거나 Zone.tsx facade를 재설계해야 한다. 합성점이 없다.

### Discussion에서 발견한 원칙

- **Zone ⊃ FocusGroup**: Zone은 여러 기능(Focus, DnD, Resize...)의 합성점
- **FocusGroup = APG Composite Widget**: focus, selection, expansion, activation — 이 범위는 정당
- **Goal #8**: "OS는 행동을 제공하고, 형태는 앱이 결정한다" → asChild 기본 = Zone은 DOM을 만들지 않는다

## Guide-level explanation

### Before (현재)

```tsx
// Zone facade → FocusGroup (실질적 Zone)
<Zone id="sidebar" role="listbox" onCopy={handleCopy}>
  <Item id="item-1">Projects</Item>
</Zone>

// 내부: Zone.tsx는 props를 그대로 FocusGroup에 전달
// FocusGroup.tsx가 div 렌더, Registry 등록, state init 모두 수행
```

### After (목표)

```tsx
// Zone이 합성점. 앱이 div를 제공 (asChild 기본)
<Zone id="sidebar" role="listbox" onCopy={handleCopy}>
  <nav className="sidebar-nav">  {/* 앱이 형태를 결정 */}
    <Item id="item-1">Projects</Item>
  </nav>
</Zone>

// 내부: Zone → ZoneContext + ZoneRegistry + OS_ZONE_INIT
//        └── FocusGroup (headless) → FocusContext + ARIA 투사 + autoFocus
```

### DnD가 올 때 (미래)

```tsx
<Zone id="kanban-col" role="listbox" draggable onDrop={handleDrop}>
  <section className="column">
    <Item id="card-1" />
  </section>
</Zone>

// 내부: Zone → ZoneContext + ZoneRegistry + OS_ZONE_INIT
//        ├── FocusGroup (headless) → APG 행동
//        └── DnDProvider (headless) → DnD 행동
//        └── Slot → 모든 props를 <section>에 머지
```

## Reference-level explanation

→ `prd.md` 참조.

## Drawbacks

- 현재 동작하는 코드를 구조적으로 변경하므로 regression 위험
- 모든 앱(Todo, Builder, DocsViewer)의 Zone/Item 사용부에 영향
- asChild 전환 시 기존 `className`, `style` 등의 props 전달 방식 변경

## Rationale and alternatives

| 대안 | 기각 이유 |
|------|----------|
| A. 이름만 고치기 (`FOCUS_GROUP_INIT` → `OS_ZONE_INIT`) | 근본 원인(책임 혼재)이 남음. DnD 올 때 다시 해야 함 |
| B. Zone에 FocusGroup을 합치기 | Zone이 god component가 됨. 기능 추가마다 Zone 비대화 |
| C. 현상 유지 | DnD/Resize 올 때 구조가 무너짐 |

## Unresolved questions

1. FocusGroup이 ARIA를 Zone의 child div에 투사하는 메커니즘: `containerRef` vs declarative props
2. ZoneState 내부 슬롯 분리 시점: 지금 vs DnD 도입 시
3. 기존 테스트(unit + integration + e2e) 마이그레이션 전략
