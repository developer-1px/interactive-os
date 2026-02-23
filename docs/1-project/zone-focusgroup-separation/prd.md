# PRD — Zone/FocusGroup 책임 분리

> Status: Draft
> Priority: High
> Scope: OS Core (`src/os/`)

## 1. 목표

Zone을 합성점(composition point)으로, FocusGroup을 headless APG 기능 모듈로 분리한다.
asChild를 기본으로 하여 DOM 소유권을 앱에게 완전히 넘긴다.

## 2. 현재 구조 (As-Is)

```
Zone.tsx (facade — props 패스스루 40줄)
 └── FocusGroup.tsx (실질적 Zone)
      ├── <div data-focus-group={groupId}>    ← Zone의 일
      ├── generateGroupId() → focus-group-N  ← Zone의 일
      ├── FOCUS_GROUP_INIT → ZoneState 초기화 ← Zone의 일
      ├── ZoneRegistry.register()             ← Zone의 일
      ├── FocusGroupContext (zoneId, config)   ← 혼재
      ├── resolveRole() → config              ← FocusGroup의 일
      ├── ARIA 속성 (role, orientation, ...)   ← FocusGroup의 일
      ├── autoFocus + focusStack              ← FocusGroup의 일
      └── 앱 콜백 (onCopy, onDelete, onUndo)  ← Zone의 일
```

## 3. 목표 구조 (To-Be)

```
Zone.tsx (합성점 — headless, asChild 기본)
 ├── 자기 일:
 │   ├── Zone ID 생성 → zone-N
 │   ├── OS_ZONE_INIT → ZoneState 초기화
 │   ├── ZoneRegistry.register()
 │   ├── ZoneContext 제공 (zoneId, scope)
 │   ├── 앱 콜백 라우팅 (onCopy, onDelete, onUndo...)
 │   └── Slot → 모든 props를 child element에 머지
 │
 ├── FocusGroup (headless capability — div 없음)
 │   ├── resolveRole() → FocusGroupConfig
 │   ├── ARIA props 기여 → Slot에 전달
 │   ├── autoFocus + focusStack
 │   └── FocusContext 제공 (config, role)
 │
 └── (미래) DnDProvider, ResizeProvider...
```

## 4. 변경 사항

### 4.1 리네이밍

| 현재 | → 변경 후 | 파일 |
|------|----------|------|
| `FOCUS_GROUP_INIT` (커맨드명) | `OS_ZONE_INIT` | FocusGroup.tsx → Zone.tsx |
| `INIT_ZONE` (변수명) | `OS_ZONE_INIT` (동일) | 이동 |
| `generateGroupId()` | `generateZoneId()` | Zone.tsx |
| `focus-group-N` (auto ID) | `zone-N` | Zone.tsx |
| `data-focus-group` | `data-zone` | Zone.tsx, listeners, shared.ts |
| `groupId` (내부 변수) | `zoneId` | Zone.tsx |

### 4.2 Context 분리

```typescript
// Before: 하나의 혼합 context
interface FocusGroupContextValue {
  zoneId: string;
  config: FocusGroupConfig;
  zoneRole?: ZoneRole;
  scope: ScopeToken;
}

// After: 두 개의 분리된 context
interface ZoneContextValue {
  zoneId: string;
  scope: ScopeToken;
}

interface FocusContextValue {
  config: FocusGroupConfig;  // 이름 유지 — APG config
  role?: ZoneRole;
}
```

### 4.3 ZoneRegistry 슬롯 구조

```typescript
// Before: flat
interface ZoneEntry {
  config: FocusGroupConfig;
  onAction?: ZoneCallback;
  onCopy?: ZoneCallback;
  // ... 모두 flat
}

// After: capability 슬롯
interface ZoneEntry {
  element?: HTMLElement | null;
  parentId: string | null;

  // Zone-level (앱 콜백)
  onCopy?: ZoneCallback;
  onCut?: ZoneCallback;
  onPaste?: ZoneCallback;
  onDelete?: ZoneCallback;
  onMoveUp?: ZoneCallback;
  onMoveDown?: ZoneCallback;
  onUndo?: BaseCommand;
  onRedo?: BaseCommand;
  getItems?: () => string[];

  // Capability: Focus (APG)
  focus: {
    config: FocusGroupConfig;
    onAction?: ZoneCallback;
    onSelect?: ZoneCallback;
    onCheck?: ZoneCallback;
    onDismiss?: BaseCommand;
    itemFilter?: (items: string[]) => string[];
    getExpandableItems?: () => Set<string>;
    getTreeLevels?: () => Map<string, number>;
  };
}
```

### 4.4 asChild Slot 메커니즘

Zone은 자체 div를 렌더하지 않는다. Slot 패턴으로 child의 첫 번째 element에 props를 머지한다.

```tsx
// 앱 사용
<Zone id="sidebar" role="listbox">
  <nav className="sidebar">
    <Item id="item-1" />
  </nav>
</Zone>

// 렌더 결과: <nav> 하나. Zone의 div 없음.
<nav id="sidebar" data-zone="sidebar" role="listbox"
     aria-orientation="vertical" className="sidebar">
  ...
</nav>
```

### 4.5 커맨드에서 data attribute 참조 변경

| 파일 | 변경 |
|------|------|
| `1-listeners/mouse/MouseListener.tsx` | `data-focus-group` → `data-zone` |
| `1-listeners/shared.ts` | `data-focus-group` → `data-zone` |

### 4.6 유지 (변경 안 함)

| 이름 | 유지 이유 |
|------|----------|
| `FocusGroupConfig` | APG composite widget의 config — 이름 정확 |
| `ZoneState` | 이미 올바른 이름 |
| `ZoneRegistry` | 이미 올바른 이름 |
| `ZoneEntry` | 이미 올바른 이름 (슬롯 구조만 변경) |
| `initialZoneState` | 이미 올바른 이름 |

## 5. 영향 범위

### OS Core

| 파일 | 변경 유형 |
|------|----------|
| `6-components/base/FocusGroup.tsx` | Zone 책임 추출 → headless 축소 |
| `6-components/primitives/Zone.tsx` | facade → 진짜 Zone (합성점 + asChild) |
| `6-components/primitives/Item.tsx` | `useFocusGroupContext` → `useZoneContext` + `useFocusContext` |
| `6-components/base/FocusItem.tsx` | 동일 |
| `6-components/field/Field.tsx` | 동일 |
| `2-contexts/zoneRegistry.ts` | ZoneEntry 슬롯 구조 |
| `1-listeners/mouse/MouseListener.tsx` | data attribute 변경 |
| `1-listeners/shared.ts` | data attribute 변경 |
| `3-commands/focus/focus.ts` | 필요시 entry.focus.config 접근 |

### Apps (마이그레이션)

| 앱 | 영향 |
|----|------|
| Todo | `<Zone>` 하위에 자체 div 필요 (asChild) |
| Builder | 동일 |
| DocsViewer | 동일 |

### Tests

| 테스트 | 영향 |
|--------|------|
| `data-focus-group` 사용하는 unit tests | → `data-zone` |
| `createIntegrationTest` / `createHeadlessTest` | initialZoneState 유지, 접근 경로 변경 가능 |
| `FocusGroupConfig` 참조 테스트 | config 유지, entry 접근 경로만 변경 |

## 6. 마이그레이션 순서

1. **T1**: Slot 유틸 구현 (또는 기존 것 확인)
2. **T2**: Context 분리 — `ZoneContext` + `FocusContext`
3. **T3**: Zone.tsx 재작성 — 합성점, asChild, OS_ZONE_INIT
4. **T4**: FocusGroup.tsx headless 전환 — div 제거, ARIA props 반환
5. **T5**: ZoneEntry 슬롯 구조 변경 + 커맨드 접근 경로 수정
6. **T6**: data attribute 변경 (`data-focus-group` → `data-zone`)
7. **T7**: 앱 마이그레이션 (Todo, Builder, DocsViewer)
8. **T8**: 테스트 마이그레이션 + 전체 검증

## 7. 엣지 케이스

1. **FocusGroup 없는 Zone**: 미래에 DnD만 있는 Zone. Focus capability가 optional이어야 함.
2. **중첩 Zone**: 부모-자식 Zone 관계. `parentId` 해석은 Zone 레벨.
3. **Dialog/AlertDialog**: `autoFocus: true`인 Zone. FocusGroup이 autoFocus를 Zone의 child ref로 수행.
4. **SSR**: `useMemo`에서 `OS_ZONE_INIT` dispatch 유지 (renderToString 호환).

## 8. 성공 기준

- [ ] `grep -rn "FocusGroup" src/os/` → base 파일 + config + context만 남음 (Zone 책임 0)
- [ ] `grep -rn "data-focus-group" src/` → 0건
- [ ] `grep -rn "FOCUS_GROUP_INIT" src/` → 0건
- [ ] 모든 기존 테스트 통과
- [ ] Inspector에서 `OS_ZONE_INIT` 표기 확인
