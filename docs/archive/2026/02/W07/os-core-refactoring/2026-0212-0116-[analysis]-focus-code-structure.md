# Focus 코드 구조 분석 — 유령 상태의 해부

## 1. 개요

`os-new/` 포커스 시스템에 **3개의 병렬 상태 시스템**이 공존하고 있다.
이 중 `FocusData`는 이미 죽었어야 할 레거시인데, 아직 10여 곳에서 참조되며 좀비로 살아있다.

## 2. 세 개의 포커스 시스템

### 2.1 현재 구조 한 눈에

```
┌─────────────────────────────────────────────────────┐
│                  FocusGroup (mount)                  │
│                                                     │
│  ┌─── kernel.dispatch(INIT_ZONE) ──► kernel state   │
│  │    os.focus.zones[id] = { ... }                  │
│  │                                                   │
│  └─── ZoneRegistry.register() ──► ZoneRegistry      │
│       { config, element, role, onDismiss }           │
│                                                     │
│  ╳── FocusData.set() ──► (등록 안 함!)              │
└─────────────────────────────────────────────────────┘
```

| 시스템 | 저장소 | 뭘 저장하나 | 사용처 |
|---|---|---|---|
| **kernel** `os.focus` | 커널 상태 트리 | `focusedItemId`, `selection`, `expandedItems`, `editingItemId`, `focusStack` | FocusSensor, 3-commands/*, FocusGroup, 5-hooks/* |
| **ZoneRegistry** | `Map<id, ZoneEntry>` | `config`, `element`, `role`, `parentId`, `onDismiss` | 3-commands/navigate, escape, activate, tab 등 |
| **FocusData** ☠️ | `WeakMap<Element, ZoneData>` | config, **command bindings** (onCopy/onUndo 등), **Zustand store**, parentId | Inspector, middleware, FocusDebugOverlay, analyzer |

### 2.2 핵심 문제: FocusData는 아무도 채워주지 않는다

FocusGroup은 `FocusData.set()`을 **호출하지 않는다** (line 13: "No Zustand, no FocusData, no global mutable state").

그런데 여전히 읽는 곳이 있다:

| 파일 (읽기) | 뭘 읽나 | 대체 가능 소스 |
|---|---|---|
| `dispatchToZone.ts` | `FocusData.getActiveZone()` → command bindings (`onCopy`, `onUndo`) | ZoneRegistry (command bindings 추가 필요) |
| `historyKernelMiddleware.ts` | `FocusData.getActiveZone()` → `store.getState().focusedItemId` | `kernel.getState().os.focus` |
| `useFocusRecovery.ts` | `FocusData.getActiveZoneId()`, `getActiveZone()` | `kernel.useComputed(s => s.os.focus.activeZoneId)` |
| `FocusDebugOverlay.tsx` | `FocusData.getActiveZoneId()`, `getById()` → `store.getState()` | `kernel.useComputed(s => s.os.focus)` |
| `analyzer.ts` | `FocusData.getActiveZoneId()`, `getById()`, `getFocusStackDepth()` | `kernel.getState().os.focus` |
| `OSStateViewer.tsx` | `FocusData.getActiveZoneId()`, `getFocusPath()`, `getOrderedZones()` | kernel state + ZoneRegistry |
| `CommandInspector.tsx` | `FocusData.getActiveZoneId()`, `getFocusPath()`, `getById()` | kernel state + ZoneRegistry |

> [!CAUTION]
> FocusData는 **더 이상 쓰여지지 않으면서 읽히고 있다.**
> 이미 stale 데이터 또는 null만 반환하는 상태일 가능성이 높다.

## 3. FocusData가 가진 것 중 kernel/ZoneRegistry에 없는 것

| FocusData 기능 | 대체 방법 |
|---|---|
| `getActiveZoneId()` | `kernel.getState().os.focus.activeZoneId` ✅ 이미 있음 |
| `getById(id).store.getState()` (focusedItemId 등) | `kernel.getState().os.focus.zones[id]` ✅ 이미 있음 |
| `getFocusStackDepth()` | `kernel.getState().os.focus.focusStack.length` ✅ 이미 있음 |
| `subscribeActiveZone()` | `kernel.subscribe()` 또는 `kernel.useComputed()` ✅ 가능 |
| **command bindings** (`onCopy`, `onUndo` 등) | ZoneRegistry에 추가 필요 ⚠️ |
| `getOrderedZones()` (DOM 순서) | `ZoneRegistry.keys()` + DOM ordering ⚠️ |
| `getFocusPath()` (중첩 Zone 경로) | `ZoneRegistry` parentId chain으로 재구성 가능 ⚠️ |
| `getSiblingZone()` (Tab 이동) | 이미 `3-commands/tab.ts`에서 ZoneRegistry 사용 ✅ |

## 4. 남은 작업: FocusData 제거를 위한 체크리스트

### Phase 1: Command Bindings를 ZoneRegistry로 이관

현재 `dispatchToZone.ts`만 FocusData의 command bindings를 사용한다.
`ZoneEntry`에 command binding 필드를 추가하면 해결:

```diff
 // ZoneRegistry — ZoneEntry
 export interface ZoneEntry {
   config: FocusGroupConfig;
   element: HTMLElement;
   role?: ZoneRole;
   parentId: string | null;
   onDismiss?: AnyCommand;
+  // Command bindings (Zone-level delegation)
+  onAction?: BaseCommand;
+  onCopy?: BaseCommand;
+  onCut?: BaseCommand;
+  onPaste?: BaseCommand;
+  onUndo?: BaseCommand;
+  onRedo?: BaseCommand;
 }
```

→ `FocusGroup.tsx`에서 ZoneRegistry 등록 시 command props도 함께 등록

### Phase 2: 나머지 소비자를 kernel state로 전환

- `historyKernelMiddleware.ts` → `kernel.getState().os.focus`
- `useFocusRecovery.ts` → `kernel.useComputed()`
- Inspector 3개 파일 → `kernel.getState().os.focus` + `ZoneRegistry`

### Phase 3: 유틸 이동 또는 재구현

- `getFocusPath()` → ZoneRegistry parentId chain 탐색
- `getOrderedZones()` → `Array.from(ZoneRegistry.keys())`
- `FocusDebugOverlay.tsx` → kernel state 기반으로 리팩토링

### Phase 4: FocusData 삭제

- `core/focus/lib/focusData.ts` 삭제
- `core/focus/hooks/useFocusRecovery.ts` 삭제 (kernel hook으로 대체)
- `core/focus/hooks/useFocusExpansion.ts` — 이미 kernel 기반 (core에서 이동만)
- `core/focus/ui/FocusDebugOverlay.tsx` — Inspector 영역으로 이동
- `core/focus/schema/analyzer.ts` — Inspector 영역으로 이동
- `core/focus/pipeline/core/osCommand.ts` — ambient input 추적, `os-new/lib/`로 이동

## 5. 결론

`core/focus/` 문제의 본질은 **"FocusData가 유령이 된 것"**이다.

- FocusGroup은 이미 kernel + ZoneRegistry만 사용
- FocusSensor는 이미 kernel만 사용
- 3-commands/*는 이미 kernel + ZoneRegistry만 사용
- **But:** Inspector, middleware, debug overlay가 아직 FocusData를 읽고 있음

FocusData가 가진 유일한 고유 기능은 **command bindings** (`onCopy`, `onUndo` 등)인데,
이것은 `ZoneRegistry.ZoneEntry`에 필드를 추가하면 즉시 해결된다.

나머지는 전부 `kernel.getState().os.focus`로 교체 가능하다.
FocusData 제거 후 `core/focus/` 전체가 삭제 가능해진다.
