# Interactive OS — Domain Glossary

> **목적**: Interactive OS의 도메인 언어를 공식화한다.
> 이 파일의 용어가 코드, 문서, 대화 모두에서 동일하게 쓰여야 한다.
> 에이전트와 인간 모두를 위한 문서다.

---

## 왜 Glossary가 필요한가

에이전트는 세션이 초기화될 때마다 이전 대화를 기억하지 못한다.
인간도 코드베이스가 커지면 "이게 왜 이 이름인지"를 잊는다.

**같은 개념을 다른 이름으로 부르면**:
- 에이전트가 새 코드에서 다른 패턴을 도입한다
- 코드 리뷰에서 "이 개념 저도 헷갈렸어요"가 반복된다
- grep이 실패한다

이 파일이 그 방지선이다.

---

## 1. Foundation — 커널과 상태

| 용어 | 정의 | 코드 | 비고 |
|------|------|------|------|
| **Kernel** | 모든 상태 변경이 통과하는 단일 파이프라인 엔진 | `createKernel()` → `os` | AppKit이 없던 웹의 시스템 계층 |
| **Command** | 상태 변경의 의도를 담은 데이터 객체 `{ type, payload, scope }` | `BaseCommand` | 함수 호출이 아니라 "메시지" |
| **Dispatch** | 커맨드를 커널에 전달하는 행위 | `os.dispatch(cmd)` | |
| **Middleware** | Dispatch 파이프라인의 중간 처리기 | `Middleware` | 로깅, undo/redo 등 |
| **Scope / ScopeToken** | 커맨드가 적용되는 소유권 경계 | `ScopeToken` | app 또는 zone 단위 |
| **Context** | 커맨드 실행 시 lazy하게 주입되는 DOM 데이터 | `os.defineContext()` | `DOM_ITEMS`, `DOM_RECTS` 등 |
| **AppState** | 전체 앱 상태 `{ os: OSState, apps: Record }` | `AppState` | |
| **OSState** | OS 자체의 상태 (focus, overlays, toasts, drag) | `OSState` | |

---

## 2. Spatial — 포커스 시스템

### 핵심 개념

| 용어 | 정의 | 코드 | 비고 |
|------|------|------|------|
| **Zone** | 포커스 관리의 최소 독립 영역. "이 영역은 리스트처럼 행동한다" | `Zone` 컴포넌트, `ZoneState` | ZIFT의 Z |
| **Item** | Zone 안에서 포커스를 받을 수 있는 개별 요소 | `Item` 컴포넌트, `data-focus-item` | ZIFT의 I |
| **Field** | 텍스트 편집이 가능한 Item (input, contenteditable) | `FieldBindings` | ZIFT의 F |
| **Trigger** | 활성화(Enter/Click)에 반응하는 Item (button-like) | `Trigger` 컴포넌트 | ZIFT의 T |
| **Focus** | 현재 어떤 아이템에 커서가 있는가 | `focusedItemId` | `activeZoneId` + `focusedItemId` |
| **Active Zone** | 현재 포커스를 소유하고 있는 Zone | `activeZoneId` | |
| **Focus Stack** | 오버레이 열릴 때 현재 포커스를 저장하고, 닫힐 때 복원하는 스택 | `FocusStackEntry[]` | dialog/modal 복원에 사용 |

### ZIFT란

**Z**one → **I**tem → **F**ield → **T**rigger

4개 개념으로 모든 UI 상호작용을 선언할 수 있다.

```
┌─ Zone (listbox) ──────────────────┐
│  ┌─ Item ─┐  ┌─ Item ─────────┐  │
│  │ Trigger│  │ Field          │  │
│  └────────┘  └────────────────┘  │
└───────────────────────────────────┘
```

### Zone 상태 구조

| 필드 | 타입 | 의미 |
|------|------|------|
| `focusedItemId` | `string \| null` | 현재 포커스된 아이템 |
| `lastFocusedId` | `string \| null` | zone 재진입 시 복원 대상 |
| `editingItemId` | `string \| null` | 현재 편집 중인 field |
| `selection` | `string[]` | 선택된 아이템들 |
| `selectionAnchor` | `string \| null` | range 선택의 기준점 |
| `expandedItems` | `string[]` | 펼쳐진 트리 노드들 |
| `stickyX` / `stickyY` | `number \| null` | 격자 네비게이션의 위치 기억 |
| `caretPositions` | `Record<fieldId, number>` | field별 커서 위치 캐시 |

### ZoneState의 ZoneCursor 변환

`ZoneState` (OS 내부) → `ZoneCursor` (App 콜백에 전달)

```typescript
// OS는 focusedItemId를 안다
// App은 "어떤 아이템이 무슨 상태인지"가 필요하다
ZoneCursor {
  focusId: string         // 현재 포커스
  selection: string[]      // 선택 목록
  anchor: string | null    // range 기준
  isExpandable: boolean    // 펼칠 수 있는가
  isDisabled: boolean      // 비활성화됐는가
  treeLevel: number | undefined  // 트리 깊이
}
```

---

## 3. ARIA Role Presets — Zone의 행동 프리셋

Zone이 선언하는 `role`이 모든 행동(navigate, tab, select, activate, dismiss)을 결정한다.

| Role | 원형 | 방향 | 선택 | Tab |
|------|------|------|------|-----|
| `listbox` | ARIA Listbox | vertical | single/multi | escape |
| `menu` | ARIA Menu | vertical | none | escape |
| `menubar` | ARIA Menubar | horizontal | none | escape |
| `tree` | ARIA Tree | vertical + arrowExpand | none | escape |
| `treegrid` | ARIA Treegrid | both | multiple | escape |
| `grid` | ARIA Grid | both | multiple | escape |
| `tablist` | ARIA Tablist | horizontal | none | escape |
| `radiogroup` | ARIA Radiogroup | vertical (loop) | single | escape |
| `toolbar` | ARIA Toolbar | horizontal | none | escape |
| `dialog` | ARIA Dialog | vertical | none | trap |
| `alertdialog` | ARIA Alert Dialog | vertical | none | trap |
| `combobox` | ARIA Combobox | vertical | none | escape |
| `accordion` | ARIA Accordion | vertical | none | escape |
| `disclosure` | ARIA Disclosure | — | none | — |
| `application` | Custom | both (seamless) | none | flow |
| `textbox` | Custom Field Zone | — | none | flow |
| `group` | Generic | vertical | none | flow |

> **Tab behavior 해설**:
> - `escape`: Tab이 zone을 벗어나 다음 zone으로 이동
> - `trap`: Tab이 zone 안에서 순환 (dialog)
> - `flow`: Tab이 zone 내부 요소들을 순서대로 이동

---

## 4. Input Layer — 파이프라인 1단계

### 입력 흐름

```
물리 이벤트 → Listener (React) → sense → resolve → dispatch
```

| 단계 | 컴포넌트/함수 | 역할 |
|------|------------|------|
| DOM 이벤트 | `KeyboardListener`, `FocusListener`, `PointerListener`, `ClipboardListener` | React 어댑터 |
| sense | `senseMouse()` | DOM → 원시 데이터 |
| resolve | `resolveKeyboard()`, `resolveMouse()`, `resolvePointer()`, `resolveClipboard()` | Input → Commands |
| dispatch | `os.dispatch()` | 커맨드 전달 |

### ZIFT Responder Chain (키보드)

키를 받았을 때 우선순위:

```
Field (편집 중인 input/contenteditable)
  ↓ 처리 못하면
Item (treeitem 확장, checkbox 체크 등 role별)
  ↓ 처리 못하면
Zone (등록된 커스텀 keybinding)
  ↓ 처리 못하면
OS Global (기본 키맵: 방향키, Tab, Escape, Enter)
```

---

## 5. Behavior Layer — 파이프라인 3단계

### Navigation

| 개념 | 정의 |
|------|------|
| **Navigate** | Zone 내 아이템 간 포커스 이동 (방향키) |
| **Tab** | Zone 간 포커스 이동 (Tab/Shift+Tab) |
| **Entry** | Zone에 진입할 때 어느 아이템에 포커스할지 결정 (`first` / `last` / `restore` / `selected`) |
| **Linear Strategy** | 아이템을 순서대로 이동 (1D: listbox, menu 등) |
| **Spatial Strategy** | 2D 좌표 기반 가장 가까운 아이템으로 이동 (grid, treegrid) |
| **Corner Strategy** | 가상 격자를 구성해 column-aware 이동 (autoflow grid) |
| **stickyX / stickyY** | 상하 이동 시 열 위치를 기억하는 "가상 커서" |

### Selection

| 개념 | 정의 |
|------|------|
| **Selection** | 포커스와 독립적인 "선택 상태" |
| **SelectionAnchor** | Shift+Click range 선택의 기준점 |
| **followFocus** | 포커스가 이동하면 선택도 따라간다 (single-select listbox 패턴) |
| **mode: none** | 선택 불가 |
| **mode: single** | 단일 선택 |
| **mode: multiple** | 다중 선택 (Cmd/Ctrl+Click) |

### Activate / Dismiss

| 개념 | 정의 |
|------|------|
| **Activate** | Enter/Click으로 포커스된 아이템을 실행한다 |
| **Dismiss** | Escape 또는 바깥 클릭으로 닫는다 |
| **Expand/Collapse** | 트리 노드를 펼치거나 접는다 (ArrowRight/Left 또는 Enter) |

---

## 6. App Layer — 앱 개발 API

### defineApp

```
defineApp(appId, initialState)
  ├─ .defineCondition(name, predicate)   → Condition<S>
  ├─ .defineSelector(name, fn)           → Selector<S, T>
  ├─ .registerCommand(type, handler)     → CommandFactory
  ├─ .createZone(name)
  │    ├─ .command(type, handler)        → CommandFactory
  │    └─ .bind(config)                  → BoundComponents { Zone, Item, Trigger, Field, When }
  └─ .create(overrides)                  → TestInstance
```

### 핵심 타입

| 용어 | 정의 |
|------|------|
| **AppHandle** | `defineApp()`의 반환값. 앱의 모든 API에 대한 핸들 |
| **ZoneHandle** | `createZone()`의 반환값. zone 레벨 커맨드와 bind API |
| **BoundComponents** | `bind()`의 반환값. `{ Zone, Item, Trigger, Field, When }` React 컴포넌트 묶음 |
| **Condition** | 이름이 있는 boolean predicate. `when:` 가드에 사용 | 
| **Selector** | 이름이 있는 상태 파생 함수. `useComputed(selector)` |
| **CommandFactory** | 커맨드를 만드는 호출 가능한 함수 (payload → BaseCommand) |
| **AppSlice** | 앱별 격리된 상태 슬라이스. `registerAppSlice()`로 생성 |
| **AppModule** | 설치 가능한 행동 단위 (Vite Plugin 패턴). `install()` 메서드를 가짐 |

### ZoneBindings (bind 설정)

```typescript
zone.bind({
  role: "listbox",           // ZoneRole → 행동 프리셋 자동 적용
  onAction: (cursor) => ..., // Enter/Click 처리
  onSelect: (cursor) => ..., // 선택 변경 처리
  onDelete: (cursor) => ..., // Delete 처리
  onCopy: (cursor) => ...,   // Cmd+C 처리
  // ...
  triggers: [               // item별 개별 콜백
    { id: "item-1", onActivate: MY_CMD() }
  ]
})
```

---

## 7. Collection Layer

| 용어 | 정의 |
|------|------|
| **NormalizedCollection** | `{ entities: Record<id, T>, order: Record<parentId, id[]> }`. O(1) 조회 + 순서 보존 |
| **entities** | id → 엔티티 맵 (O(1) lookup) |
| **order** | parentId → 자식 id 배열. `""` = root |
| **CollectionZone** | `NormalizedCollection` + Zone 자동 연결. CRUD + 클립보드 커맨드가 자동 생성됨 |
| **ClipboardEntry** | CollectionZone 내부 클립보드 스토어. `{ source, items, isCut }` |

---

## 8. Testing Layer

| 용어 | 정의 |
|------|------|
| **Headless** | DOM 없이 커널 상태만으로 계산하는 모드 |
| **HeadlessPage** | Vitest에서 실행되는 DOM-없는 테스트 환경 |
| **BrowserPage** | Inspector에서 실행되는 시각적 테스트 환경 |
| **TestInstance** | `defineApp.create()`로 생성. headless에서 앱을 완전히 제어하는 인스턴스 |
| **Page** | Playwright-호환 인터페이스. `locator()`, `press()` |
| **Locator** | 요소를 찾고 `click()`, `getAttribute()`를 제공 |
| **simulateKeyPress** | 키 입력을 headless에서 재현 (테스트 전용) |
| **simulateClick** | 클릭을 headless에서 재현 (테스트 전용) |
| **resolveElement** | 요소 ID로 모든 DOM 속성을 계산. Playwright `locator("#id")`의 headless 등가물 |

---

## 9. OS 아키텍처 파이프라인

```
사용자 입력 (Intent)
        │
        ▼
① Spatial (어디에 있는가)
   Zone, Item, Focus, Focus Stack, Active Zone
        │
        ▼
② Input Translation (무엇을 원하는가)
   Keyboard, Mouse/Pointer, Clipboard
   → sense → extract → resolve → dispatch
        │
        ▼
③ Behavior (의도에 맞는 행동)
   Navigate, Tab, Select, Activate, Dismiss
   Expand, Field, Overlay, Clipboard, Move, Undo/Redo
        │
        ▼
④ Output (결과를 전달)
   ARIA 속성, Focus Effect, Toast
        │
        ▼
앱의 반응 (Response)
```

### OS 파일 구조 ↔ 파이프라인 매핑

| 폴더 | 파이프라인 단계 |
|------|--------------|
| `src/os/1-listeners/` | ② Input — DOM → Commands |
| `src/os/2-contexts/` | ① Spatial — ZoneRegistry, DOM Context |
| `src/os/3-commands/` | ③ Behavior — 커맨드 핸들러 |
| `src/os/4-effects/` | ④ Output — focus(), scroll() |
| `src/os/5-hooks/` | React 연결 훅 |
| `src/os/6-components/` | React 컴포넌트 (ZIFT 프리미티브) |

---

## 10. 이름 선택 의사결정 트리

```
새 개념에 이름을 붙이려 한다
        │
        ├─ 이미 비슷한 개념이 코드에 있는가?
        │     └─ YES → 그 이름/패턴을 따른다
        │
        ├─ 어느 레이어인가?
        │     ├─ Listener (1) → resolve + 입력원 (resolveKeyboard, resolveMouse)
        │     ├─ Context (2)  → DOM_ 또는 ZONE_ 접두사 상수
        │     ├─ Command (3)  → OS_ + SCREAMING_SNAKE 커맨드
        │     ├─ Hook (5)     → use + 도메인명사 (useFocusedItem)
        │     └─ Component (6) → PascalCase (Zone, Item)
        │
        ├─ 무엇을 하는 함수인가?
        │     ├─ "외부 입력을 분석해 판단한다" → resolve
        │     ├─ "상태에서 값을 계산한다"      → compute
        │     ├─ "커널 상태를 읽는다"          → read
        │     ├─ "레지스트리에서 꺼낸다"       → get
        │     ├─ "새 인스턴스를 만든다"        → create
        │     ├─ "등록한다"                 → register / define
        │     ├─ "조립한다"                 → build
        │     └─ "boolean을 반환한다"        → is / has
        │
        └─ 타입/인터페이스인가?
              ├─ 레지스트리 저장 단위 → Entry
              ├─ 함수 반환값        → Result
              ├─ API 핸들           → Handle
              ├─ 커맨드 인자        → Payload
              ├─ 상태 구조체        → State
              └─ 설정 객체         → Config
```
