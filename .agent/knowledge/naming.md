# Naming Knowledge — 이름 선택 도구

> `/naming` 워크플로우의 핵심 지식.
> 이름을 지을 때 여기를 먼저 열어라. 기존 코드베이스의 패턴이 법이다.

---

## 1. 동사 Dictionary — 함수 이름의 첫 단어

> 동사가 경계를 결정한다. 같은 동사를 다른 의미로 쓰지 않는다.

### 1.1 판단 / 변환 동사

| 동사 | 의미 | 입력 → 출력 | 순수 | 실제 사용 예 |
|------|------|------------|------|------------|
| `resolve` | 입력을 분석하여 결과를 결정한다 | `Input → Decision` | ✅ | `resolveNavigate(direction, items, config) → NavigateResult` |
| `compute` | 상태로부터 속성을 계산한다 | `KernelState → Attrs` | ✅ | `computeItem(kernel, itemId, zoneId) → ItemResult` |
| `extract` | 원시 데이터에서 구조를 뽑아낸다 | `RawEvent → SenseData` | ✅ | `extractMouseInput()` (명시적 분리가 필요할 때) |

**`resolve` vs `compute` 구분 기준**:
- 🟡 입력이 "외부 이벤트"이면 → `resolve` (의사결정)
- 🟡 입력이 "현재 상태"이면 → `compute` (도출)

**사용 금지 패턴**:
- ❌ `resolveItem()` — item "무엇을" resolve하는지 불분명. `computeItem()` 또는 `resolveNavigate()`처럼 동작을 명시
- ❌ `computeRoute()` — route는 외부 입력의 판단. `resolve`가 맞다

---

### 1.2 읽기 동사

| 동사 | 의미 | 입력 → 출력 | 순수 | 실제 사용 예 |
|------|------|------------|------|------------|
| `read` | 커널 상태를 읽는다 (헤드리스) | `HeadlessKernel → T` | ✅ | `readActiveZoneId(kernel)`, `readSelection(kernel)` |
| `get` | 레지스트리 / 컬렉션에서 꺼낸다 | `Id → T \| undefined` | ✅ | `ZoneRegistry.get(id)`, `getChildren(collection, parentId)` |

**`read` vs `get` 구분 기준**:
- 🟡 커널(상태) 접근이면 → `read` (헤드리스 맥락)
- 🟡 맵/레지스트리/컬렉션 조회이면 → `get`

**사용 금지 패턴**:
- ❌ `readEntry()` — registry 조회는 `get`. `ZoneRegistry.get(id)`
- ❌ `getState()` — 커널 API가 이미 쓰므로 헤드리스 함수에선 `readXxx()`로

---

### 1.3 탐색 동사

| 동사 | 의미 | 입력 → 출력 | 순수 | 실제 사용 예 |
|------|------|------------|------|------------|
| `find` | 조건을 만족하는 항목을 탐색한다 (없으면 null) | `Haystack, Predicate → T \| null` | ✅ | `findBestCandidate(rect, direction, candidates)` |
| `sense` | DOM에서 원시 데이터를 읽는다 | `HTMLElement, Event → SenseData` | ❌ (DOM) | `senseMouse(event)` |

---

### 1.4 생성 / 등록 동사

| 동사 | 의미 | 부수효과 | 실제 사용 예 |
|------|------|----------|------------|
| `create` | 새 인스턴스를 반환한다 | 없음 | `createKernel()`, `createCollection()`, `createCollectionZone()` |
| `define` | 선언을 등록하고 핸들을 반환 | 없음 (선언적) | `defineApp()`, `os.defineCommand()`, `os.defineContext()` |
| `register` | 런타임 레지스트리에 추가 | Map/Array 변경 | `registerAppSlice()`, `registerHeadlessZone()`, `Keybindings.register()` |
| `build` | 여러 조각을 조립하여 구조체를 만든다 | 없음 | `buildZoneCursor()`, `buildZoneEntry()`, `buildVirtualGrid()` |
| `generate` | 유니크 ID를 생성한다 | counter 증가 | `generateZoneId()`, `generateGroupId()` |

**`create` vs `build` vs `define` 구분 기준**:
- 🟡 독립 인스턴스(클래스 수준)를 새로 만들면 → `create`
- 🟡 여러 입력을 조립해 데이터 구조를 만들면 → `build`
- 🟡 선언적으로 등록+반환이면 → `define`

---

### 1.5 상태 변경 동사

| 동사 | 의미 | 부수효과 | 실제 사용 예 |
|------|------|----------|------------|
| `set` | 값을 직접 설정한다 | Map/변수 변경 | `setDispatching(true)`, `ZoneRegistry.setDisabled()` |
| `apply` | 규칙을 적용하여 상태를 수정한다 | draft 변경 | `applyFollowFocus(zone, itemId, config)` |
| `ensure` | 없으면 초기화하고 반환한다 | 필요 시 초기화 | `ensureZone(draft, zoneId)` |
| `dispatch` | 커맨드를 커널에 전달한다 | 커널 파이프라인 | `os.dispatch(cmd)`, `dispatchResult(kernel, result)` |
| `simulate` | 사용자 상호작용을 재현한다 (테스트 전용) | kernel.dispatch | `simulateKeyPress(kernel, key)`, `simulateClick(kernel, itemId)` |

**사용 금지 패턴**:
- ❌ 프로덕션 코드에서 `simulate*` — 테스트 인프라 전용
- ❌ `apply` + 순수 판단 조합 — `apply`는 상태 변경이 수반됨. 판단만 하는 함수는 `resolve`

---

### 1.6 질의 동사 (boolean)

| 동사 | 의미 | 실제 사용 예 |
|------|------|------------|
| `is` | 현재 상태가 ~인가? | `isCandidate()`, `isDispatching()`, `isCheckedRole()`, `isExpandableRole()` |
| `has` | ~를 가지고 있는가? | `ZoneRegistry.has()`, `Keybindings.has()` |
| `can` | ~할 수 있는가? (권한/가능성) | 미사용 — 필요 시 추가 |

---

### 1.7 DOM/Effect 동사 (비순수 — 주의)

| 동사 | 의미 | DOM | 실제 사용 예 |
|------|------|-----|------------|
| `bind` | React 컴포넌트에 Zone 설정을 연결 | React 생성 | `zone.bind(config)` |
| `from` | 다른 형식으로 변환 (주로 데이터 변환) | 없음 | `fromEntities()`, `fromNormalized()` |
| `to` | 타입 변환 (단순 캐스팅) | 없음 | `toRect(domRect)` |

---

## 2. 접미사 Dictionary — 타입 이름의 마지막 단어

| 접미사 | 의미 | 불변 여부 | 예시 |
|--------|------|----------|------|
| `Config` | 동작 방식을 결정하는 설정 객체 | 불변 선호 | `NavigateConfig`, `FocusGroupConfig`, `AppSliceConfig` |
| `Entry` | 레지스트리 / 맵에 저장되는 단위 | 가변 가능 | `ZoneEntry`, `OverlayEntry`, `GridEntry`, `StrategyEntry` |
| `Result` | 함수가 반환하는 계산 결과 | 불변 | `NavigateResult`, `ResolveResult`, `EscapeResult`, `HandlerResult` |
| `Handle` | 팩토리가 반환하는 API 핸들 (메서드 묶음) | — | `AppHandle`, `ZoneHandle`, `AppSliceHandle`, `CollectionZoneHandle` |
| `Payload` | 커맨드의 인자 구조체 | 불변 | `FocusPayload`, `SelectPayload`, `OSNavigatePayload` |
| `State` | 시간에 따라 변하는 상태 구조체 | 가변 | `OSState`, `ZoneState`, `DragState`, `ItemState` |
| `Binding(s)` | 선언적으로 연결하는 설정 (단수=단일, 복수=여러) | 불변 | `ZoneBindings`, `FieldBindings`, `TriggerBinding`, `KeyBinding` |
| `Callback(s)` | 이벤트 핸들러 (Zone이 OS에 등록하는) | — | `ZoneCallback`, `ZoneCallbacks`, `ItemCallbacks` |
| `Options` | 선택적 오버라이드 설정 | 불변 | `ZoneOptions`, `HeadlessZoneOptions` |
| `Input` | `resolve*` 함수에 전달하는 입력 구조체 | 불변 | `KeyboardInput`, `MouseInput` |
| `Context` | 실행 환경 / 의존성 묶음 | — | `CommandContext`, `KeyResolveContext`, `ZoneContextValue` |
| `Info` | 탐색 결과의 보조 데이터 | 불변 | `FocusTargetInfo` |
| `Factory` | 커맨드를 만드는 함수 자체 | — | `CommandFactory`, `FieldCommandFactory` |
| `Observer` | 이벤트를 관찰하는 콜백 타입 | — | `InteractionObserver` |
| `Record` | 한 번의 상호작용 기록 | 불변 | `InteractionRecord` |

**선택 기준**:
- "이 값이 레지스트리/맵에 저장되는가?" → `Entry`
- "이 값이 함수의 반환값인가?" → `Result`
- "이 값이 팩토리의 핸들인가?" → `Handle`
- "이 값이 커맨드의 인자인가?" → `Payload`

---

## 3. 상수 네이밍 패턴

| 종류 | 패턴 | 예시 |
|------|------|------|
| OS 커맨드 팩토리 | `OS_` + `SCREAMING_SNAKE` | `OS_FOCUS`, `OS_NAVIGATE`, `OS_SELECT` |
| OS Context 상수 | `DOM_` 또는 `ZONE_` + `SCREAMING_SNAKE` | `DOM_ITEMS`, `DOM_RECTS`, `ZONE_CONFIG` |
| 기본값 상수 | `DEFAULT_` + `SCREAMING_SNAKE` | `DEFAULT_NAVIGATE`, `DEFAULT_CONFIG` |
| OS 전체 커맨드 맵 | `OS_COMMANDS` (객체) — 키도 `OS_` | `OS_COMMANDS.OS_FOCUS` |

> ⚠️ **주의**: `OS_COMMANDS` 객체의 키 이름은 모두 `OS_` 접두사를 포함해야 한다.
> 현재 `COPY`, `DELETE`, `UNDO` 등 13개 키에 `OS_` 접두사가 누락된 상태. 새 커맨드를 추가할 때는 반드시 `OS_` 포함.

---

## 4. Listener 내부 파이프라인 동사 (1-listeners 전용)

```
DOM Event → sense → extract → resolve → dispatch
```

| 단계 | 동사 | 입력 | 출력 | 순수 | 허용 병합 |
|------|------|------|------|------|----------|
| ① | `sense` | `HTMLElement, Event` | `SenseData` (raw) | ❌ DOM | sense + extract 병합 가능 |
| ② | `extract` | `SenseData` | `XxxInput` (구조화) | ✅ | ← |
| ③ | `resolve` | `XxxInput` | `ResolveResult` | ✅ | 독립 필수 |
| ④ | `dispatch` | `ResolveResult` | side effect | ❌ | Listener 내부 |

- `resolve`는 **반드시** Input→Command 판단에만 사용. DOM 변환에 쓰지 않는다.
- `extract` 단계는 복잡도가 낮으면 `sense`와 합칠 수 있다.

---

## 5. 충돌 검사 체크리스트

이름을 확정하기 전에 순서대로 확인:

```bash
# 1. 같은 이름이 이미 있는가?
grep -rn "함수명" src/ --include="*.ts" --include="*.tsx"

# 2. 비슷한 이름이 다른 의미로 있는가?
grep -rn "비슷한키워드" src/ --include="*.ts"

# 3. naming-conventions.md의 케이스 규칙에 맞는가?
# 파일명 → camelCase.ts (로직), PascalCase.tsx (컴포넌트)
# 타입명 → PascalCase
# 커맨드 → OS_SCREAMING_SNAKE
```

---

## 6. 자주 틀리는 패턴

| ❌ 잘못된 이름 | ✅ 올바른 이름 | 이유 |
|--------------|--------------|------|
| `resolveItem()` | `computeItem()` | item 속성 계산 = compute |
| `getActiveZoneId()` | `readActiveZoneId()` | 커널 상태 접근 = read |
| `getAllIds()` | → 이게 맞음 (`allIds()`가 ⚠️) | get 접두사 누락 버그 |
| `useFieldHooks()` | `useField()` / `useFieldState()` | Hook 이름에 "Hooks" 금지 |
| `handleActivate()` | `activate.ts` 또는 `OS_ACTIVATE` | 커맨드는 핸들러가 아니라 커맨드 |
| `onNavigate()` | `resolveNavigate()` + `onAction` callback | on* 은 이벤트 핸들러, 판단 로직은 resolve |
| `updateZone()` | `ensureZone()` + Immer draft | update는 너무 일반적 |
| `getZoneConfig()` | `createZoneConfig()` | config를 새로 만드는 것이라 create |
