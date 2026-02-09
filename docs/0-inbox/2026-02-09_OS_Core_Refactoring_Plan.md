# OS Core 경량화 리팩토링 플랜

## 1. 개요 (Overview)

re-frame의 검증된 아키텍처를 참조하여 현재 interactive-os의 불필요한 간접층, 파편화된 상태, 오버엔지니어링을 제거한다.
목표: **같은 기능, 절반의 코드, 일직선의 흐름.**

### 현재 문제 요약

| 문제 | 원인 | re-frame 대비 |
|---|---|---|
| **상태 파편화** | focusData.ts (전역변수) + FocusGroupStore (존별) + CommandEngineStore (앱별) | re-frame은 app-db 하나 |
| **불필요한 간접층** | dispatch → eventBus → FocusIntent → runOS (4단계) | re-frame은 dispatch → handler (2단계) |
| **Zone별 스토어 분리** | 역사적 레거시, 의도 아님 | 하나의 상태 트리 내 zone map |
| **focusData가 수동 리스너** | Zustand 이전에 만들어진 구조 | store 내부로 통합 |
| **buildContext 과잉 수집** | 매 커맨드마다 모든 DOM 정보 수집 | 필요한 것만 lazy하게 |
| **폴더 깊이 과다** | features/focus/pipeline/core/osCommand.ts (5레벨) | flat structure |
| **타입 증식** | OSContext, OSResult, DOMEffect, OSState, FocusState, ZoneSnapshot... | 최소한의 타입 |

---

## 2. 분석 (Analysis)

### 2.1 현재 데이터 흐름 (AS-IS)

```
[KeyboardSensor]                            ← 1-sense
  → setCurrentInput(event)
  → KeyboardIntent classifies key           ← 2-intent (keyboard)
  → routeCommand resolves keybinding        ← 3-route
  → CommandEngineStore.dispatch(cmd)         ← 진입점
    → createCommandStore.dispatch(action)
      → useCommandEventBus.emit(action)     ← Event Bus (간접층!)
        → FocusIntent listens               ← React 컴포넌트가 라우터 역할
          → runOS(OSCommand, payload)        ← 실행
            → buildContext()                 ← 모든 DOM 정보 수집
            → command.run(ctx, payload)      ← 순수함수
            → ctx.store.setState()           ← Zone 스토어 업데이트
            → executeDOMEffect()             ← DOM 부수효과
      → TransactionLog.add()                ← 기록
```

**문제점:**
1. `useCommandEventBus` → `FocusIntent` → `runOS` 구간이 불필요한 간접층
2. `FocusIntent`는 React 컴포넌트인데, 하는 일은 command type → OSCommand 맵핑일 뿐
3. `buildContext()`가 매번 DOM rect, focus path, config 등 전부 수집
4. Zone별 Zustand 스토어가 분리되어 있어 cross-zone 상태 파악이 어려움
5. `focusData.ts`가 WeakMap + 전역변수 + 수동 리스너 — 사실상 두 번째 상태관리

### 2.2 목표 데이터 흐름 (TO-BE)

```
[Sensor]
  → dispatch({ type, payload })             ← 유일한 진입점
    → handler = registry.get(type)          ← Map lookup (직행)
    → cofx = buildCofx(type)                ← 필요한 것만 lazy 수집  
    → fx = handler(cofx, payload)           ← 순수함수 실행
    → executeFx(fx)                         ← 부수효과 실행
    → TransactionLog.add()                  ← 기록
```

**3단계: dispatch → handle → effect. 끝.**

---

## 3. 리팩토링 단계

### Phase 1: 간접층 제거 — Event Bus + FocusIntent 통합

**목표:** dispatch → handler 직행  
**난이도:** ★★☆ (중)  
**영향 범위:** 3-4 파일

#### 변경 사항

1. **FocusIntent의 command → OSCommand 맵핑을 레지스트리로 이동**
   - 현재: FocusIntent가 React 컴포넌트에서 `useCommandListener`로 event bus를 구독
   - 목표: OS command 레지스트리에 직접 등록 (`registry.register("NAVIGATE", NAVIGATE)`)

2. **createCommandStore의 coreDispatch에서 직접 runOS 호출**
   - 현재: `emit(action)` → FocusIntent가 listen → `runOS()` 
   - 목표: `coreDispatch`가 OS 커맨드인지 판단 → 직접 `runOS()` 호출

3. **useCommandEventBus 용도 축소 또는 제거**
   - 현재: 유일한 소비자가 FocusIntent + useCommandListener (Field의 isEditing 등)
   - 목표: Field의 isEditing 같은 UI 반응은 store subscribe로 대체 가능
   - `useCommandListener` 소비자 목록 확인 후 결정

#### 삭제 대상
- `FocusIntent.tsx` (React 컴포넌트 → 순수 레지스트리)
- `useCommandEventBus.ts` (소비자가 없으면 제거)
- `useCommandListener.ts` (의존도에 따라)

---

### Phase 2: 상태 통합 — focusData + FocusGroupStore → 단일 FocusStore

**목표:** 하나의 Zustand 스토어에 모든 포커스 상태  
**난이도:** ★★★ (상)  
**영향 범위:** 15+ 파일

#### 현재 상태 분포

```
focusData.ts (전역 변수)          FocusGroupStore (존별 인스턴스)
──────────────────────────        ──────────────────────────
activeZoneId: string | null       cursor: { focusedItemId, stickyX, stickyY, recoveryTargetId }
focusStack: FocusStackEntry[]     selection: { selection, selectionAnchor }
zoneDataMap: WeakMap               expansion: { expandedItems }
                                  spatial: { ... }
activeZoneListeners: Set           
focusStackListeners: Set           
```

#### 목표 구조

```typescript
interface FocusStore {
  // Global
  activeZoneId: string | null;
  focusStack: FocusStackEntry[];

  // Zone States (Map으로 통합)
  zones: Map<string, ZoneState>;
  
  // Actions
  dispatch: (event: FocusEvent) => FocusEffect[];
}

interface ZoneState {
  focusedItemId: string | null;
  selection: string[];
  selectionAnchor: string | null;
  expandedItems: string[];
  stickyX: number | null;
  stickyY: number | null;
  recoveryTargetId: string | null;
}
```

#### 핵심 변경

1. **FocusGroupStore 제거** — Zone 상태는 `FocusStore.zones` Map의 엔트리
2. **focusData.ts 제거** — activeZoneId, focusStack → FocusStore 내부
3. **ZoneData 역할 변경** — config, parentId 등 메타데이터는 별도 registry (WeakMap 유지 가능)
4. **수동 리스너 제거** — Zustand subscribe로 대체

#### 마이그레이션 전략

- `FocusData.getActiveZoneId()` → `useFocusStore(s => s.activeZoneId)`
- `FocusData.setActiveZone(id)` → `focusStore.getState().setActiveZone(id)`
- `ctx.store.setState(result.state)` → `focusStore.getState().updateZone(zoneId, result.state)`
- `useFocusGroupStoreInstance(groupId)` → `useFocusStore(s => s.zones.get(groupId))`

---

### Phase 3: 타입 정리 — OSContext 경량화

**목표:** 거대한 OSContext를 cofx 패턴으로 교체  
**난이도:** ★★☆ (중)  
**영향 범위:** osCommand.ts + 모든 OSCommand 구현체

#### 현재 OSContext (30+ 필드)

```typescript
interface OSContext {
  zoneId, focusedItemId, selection, selectionAnchor,
  expandedItems, stickyX, stickyY, config, store,
  items, itemRects, focusPath, prev, next,
  queries: DOMQueries,
  activateCommand, selectCommand, toggleCommand,
  copyCommand, cutCommand, pasteCommand, deleteCommand,
  undoCommand, redoCommand
}
```

#### 목표: 2-Layer Cofx

```typescript
interface Cofx {
  // Layer 1: Store State (항상 있음, 저렴)
  zone: ZoneState;
  config: FocusGroupConfig;
  activeZoneId: string | null;

  // Layer 2: DOM Queries (lazy, 필요할 때만)
  dom: DOMQueries;
}
```

- **Layer 1**은 항상 수집 (store에서 읽기만 하면 됨, 비용 0)
- **Layer 2** (DOM rect 등)는 lazy getter로 제공, 접근할 때만 계산
- `items`, `itemRects`, `focusPath` 등은 command가 필요할 때만 dom에서 읽음
- bound commands (activateCommand 등)는 cofx가 아닌 ZoneConfig에 포함

---

### Phase 4: 폴더 구조 평탄화

**목표:** 5레벨 → 2레벨  
**난이도:** ★☆☆ (하)  
**영향 범위:** path alias 변경만

#### AS-IS
```
os/
  features/
    focus/
      pipeline/
        core/osCommand.ts
        1-sense/FocusSensor.tsx
        2-intent/FocusIntent.tsx
        2-intent/commands/...
        3-resolve/...
      store/
        focusGroupStore.ts
        slices/cursor.ts, selection.ts, ...
      lib/focusData.ts
      hooks/...
      primitives/...
    command/
      model/createCommandStore.tsx
      store/CommandEngineStore.ts
      lib/useCommandEventBus.ts
    inspector/InspectorLogStore.ts
```

#### TO-BE
```
os/
  core/
    dispatch.ts          ← createCommandStore (경량화)
    handler.ts           ← runOS + command registry
    effects.ts           ← executeDOMEffect
    transaction.ts       ← TransactionLog
  store/
    focusStore.ts        ← 단일 포커스 스토어
    engineStore.ts       ← 앱 라우터 (CommandEngineStore)
  commands/
    navigate.ts          ← NAVIGATE command
    select.ts            ← SELECT command
    ...
  sensors/
    keyboard.tsx         ← KeyboardSensor
    mouse.tsx            ← MouseSensor
  primitives/
    FocusGroup.tsx
    FocusItem.tsx
  schema/
    types.ts             ← 통합된 타입 정의
```

---

## 4. 실행 순서와 의존 관계

```
Phase 1 (간접층 제거)
  ↓
Phase 2 (상태 통합)      ← 가장 큰 변경, Phase 1 이후에
  ↓
Phase 3 (타입 정리)      ← Phase 2의 새 store 구조에 맞춤
  ↓
Phase 4 (폴더 평탄화)    ← 마지막, 모든 로직 안정화 후
```

**Phase 1을 먼저 하는 이유:** 간접층을 제거하면 Phase 2에서 통합할 대상이 줄어든다.
**Phase 4를 마지막에 하는 이유:** 로직 변경 없이 파일 이동만 하므로 안전. 단, 모든 import path가 바뀌므로 다른 변경이 안정화된 후에.

---

## 5. 리스크와 주의사항

### 리스크
1. **Phase 2 (상태 통합)** — 영향 범위가 가장 넓음. 23개 파일이 FocusData를 사용 중
2. **Zone별 스토어 → 단일 스토어** — Zone 컴포넌트의 리렌더링 최적화 필요 (selector 전략)
3. **FocusGroup 마운트/언마운트** — 현재 storeCache가 처리. 통합 후 zones Map의 entry 생명주기 관리 필요

### 안전장치
- 각 Phase를 별도 브랜치에서 진행
- Phase마다 기존 테스트(TestBot) 통과 확인
- Phase 2는 FocusData의 API를 facade로 유지하면서 내부만 교체 (점진적 마이그레이션)

---

## 6. 기대 효과

| 지표 | 현재 | 목표 |
|---|---|---|
| 상태 저장소 수 | 3+ (focusData, FocusGroupStore×N, CommandEngineStore) | 2 (FocusStore, EngineStore) |
| dispatch → execute 단계 | 4 (dispatch → bus → intent → runOS) | 2 (dispatch → handler) |
| 폴더 깊이 | 5레벨 (features/focus/pipeline/core/) | 2레벨 (os/core/) |
| OSContext 필드 수 | 30+ | ~10 (2-layer cofx) |
| 수동 리스너 관리 | focusData.ts (2세트) | 0 (Zustand subscribe) |
| 파일 수 (os/) | ~165 | ~120 (추정 -25%) |

### re-frame 대응 달성도

| re-frame 원칙 | 현재 달성도 | 리팩토링 후 |
|---|---|---|
| `app-db` 하나 | ❌ 파편화 | ✅ FocusStore + EngineStore |
| dispatch → handler 직행 | ❌ 4단계 | ✅ 2단계 |
| Effect as Data | ✅ OSResult | ✅ 유지 |
| Coeffect injection | ⚠️ 과잉 수집 | ✅ lazy cofx |
| Interceptors as data | ✅ middleware | ✅ 유지 |
| Transaction log | ✅ 완료 | ✅ 유지 |
