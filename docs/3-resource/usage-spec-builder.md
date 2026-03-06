# Usage Spec v3 — Builder (Design Spike)

> **대상**: Visual CMS Builder (복잡성 대표)
> **방법론**: Wishful Thinking + Conceptual Integrity Check
> **규칙**: 이 코드는 **컴파일되지 않는다**. Goal을 표현하는 설계 문서다.
> **상태**: v3 — 현행 Builder 코드 기반 전수 매핑 + 컨셉맵 18개 대입 완료

---

## 1. 확정된 핵심 모델 (변경 없음)

```
App Data (자유 구조)
  │  from: (state) => NormalizedCollection
  ▼
Zone (유일한 Facade)
  NormalizedStore + entity schema + with[] 모듈
  │  to: (state, normalized) => nextState
  ▼
App Data (복원)
```

**원칙:**
- Zone이 유일한 Facade. `createCollectionZone` 등 별도 개념 불필요
- `to` 없음 → 읽기 전용. `to` 있음 → 편집 가능
- `entity` 있음 → Field 타입별 위젯 자동 결정
- `with[]` → 기능은 모듈로 합성

---

## 2. Builder 전체 Usage (v3)

### 2-A. Sidebar Zone — 트리 구조 편집

```typescript
const sidebar = app.zone("sidebar", {
  structure: "tree",

  from: (state) => normalizeTree(state.data.blocks),
  to: (state, n) => ({ ...state, data: { blocks: denormalizeTree(n) } }),

  entity: {
    label: { type: "string", mode: "inline" },
    // visible: { type: "boolean" },  // 미래 확장
  },

  with: [
    crud({
      onClone: (item) => ({ ...item, label: item.label + " (copy)" }),
      onPaste: (item) => ({ ...item, label: item.label + " (paste)" }),
    }),
    reorder(),                              // Alt+↑↓
    reparent(),                             // Alt+←→ (트리 재배치)
    clipboard(),                            // Ctrl+C/X/V
    select({ mode: "multi" }),              // Shift+Arrow, Ctrl+Click
    dnd({ axis: "vertical" }),              // 드래그 앤 드롭
    activate((item) => openProperties(item)), // Enter → 패널 열기
    history(),                              // Undo/Redo
  ],

  tab: { behavior: "flow" },
  triggers: [
    { id: "locale-switcher-trigger", overlay: "locale-menu", type: "menu" },
  ],
});
```

### 2-B. Canvas Zone — 2D 그리드 편집

```typescript
const canvas = app.zone("canvas", {
  structure: "grid",

  from: (state) => normalizeTree(state.data.blocks),
  to: (state, n) => ({ ...state, data: { blocks: denormalizeTree(n) } }),

  entity: {
    // Block.fields의 각 키가 동적 entity 필드
    // 문제: 블록 타입별로 다른 fields → 동적 schema 필요 (§4 미확정)
    title:       { type: "string", mode: "inline" },
    description: { type: "string", mode: "block" },
    buttonText:  { type: "string", mode: "inline" },
  },

  with: [
    crud({
      guard: (cursor) => isDynamicItem(cursor.focusId),  // 정적 필드 아이템 보호
      onClone: (item) => ({ ...item, label: item.label + " (copy)" }),
    }),
    reorder(),
    clipboard({
      onCopy: canvasOnCopy,     // 동적 아이템: 구조 복사, 정적: 텍스트 복사
      onCut: canvasOnCut,       // 동적만 (PRD 1.3)
      onPaste: canvasOnPaste,   // pasteBubbling: 허용하는 부모 탐색
    }),
    select({ mode: "multi" }),
    dnd({ axis: "2d" }),
    activate((item, cursor) => drillDown(cursor)),  // Enter → 하위 계층 진입
    history(),
    hierarchicalNav({                               // Builder 고유 모듈
      drillDown: "Enter",
      drillUp: ["Backslash", "Escape"],
      typingEntry: true,  // a-z, 0-9 → drill-down 트리거
    }),
  ],

  navigate: { orientation: "corner" },
  tab: { behavior: "trap" },
  activate: { onClick: true, reClickOnly: true },
  dismiss: { escape: "none" },                      // Escape = drillUp
});
```

### 2-C. Panel Zone — 읽기 전용 속성 탐색

```typescript
const panel = app.zone("panel", {
  structure: "tree",

  from: (state) => {
    const selected = sidebar.selection(state);
    return normalizeProperties(selected);    // Master-Detail 연동
  },
  // to 없음 → 읽기 전용 (탐색만)

  navigate: { orientation: "vertical", typeahead: false },
  tab: { behavior: "flow" },
});
```

**Master-Detail**: Panel의 `from`이 Sidebar의 selection을 구독 → 자동 연동. 별도 개념 불필요.

---

## 3. 컨셉맵 18개 대입

> ✅ = Zone 모델로 표현 가능 (구현 방법 명확)
> 🟡 = 방향 확정, 상세 미확정
> ❌ = Zone 모델로 표현 불가 또는 미설계

| # | 개념 영역 | Builder 사용 | Zone 모델 매핑 | 상태 |
|---|-----------|-------------|---------------|:----:|
| 1 | **Topology** | 3 zones (tree×2, grid×1). Block.children 계층 | `structure: "tree"/"grid"`, NormalizedItem.parentId/childIds | ✅ |
| 2 | **Navigation** | vertical/corner/typeahead. Home/End | Zone config: `navigate.orientation`. OS 자동 | ✅ |
| 3 | **Focus** | OS tracking. Overlay stack (locale menu). AutoFocus | OS 내장. AutoFocus는 Zero Drift WP5-6으로 해결 완료 | ✅ |
| 4 | **Selection** | multi-select (sidebar, canvas). follow-focus | `select({ mode: "multi" })` 모듈 | ✅ |
| 5 | **Activation** | Enter drill-down (canvas), Enter rename (sidebar) | `activate(fn)` 모듈. 콜백이 앱 고유 동작 결정 | ✅ |
| 6 | **Field** | string 인라인/블록 편집. fields: Record<string,string> | `entity: { fieldName: { type, mode } }` | 🟡 |
| 7 | **Overlay** | Locale menu (popup). Delete toast | `triggers: [{ overlay }]`. Toast는 OS 모듈 | ✅ |
| 8 | **Expansion** | Panel accordion. Sidebar tree expand | OS 자동 (tree role = expand 내장) | ✅ |
| 9 | **DnD** | Sidebar vertical reorder. Canvas 2D reorder | `dnd({ axis })` 모듈 | ✅ |
| 10 | **Clipboard** | Copy/Cut/Paste + pasteBubbling (canvas) | `clipboard({ onCopy, onCut, onPaste })` 모듈 | ✅ |
| 11 | **History** | Undo/Redo | `history()` 모듈 | ✅ |
| 12 | **Data** | Tree of Blocks. NormalizedStore | `from`/`to` + NormalizedStore. 7가지 구조 통합 | ✅ |
| 13 | **CRUD** | Add/Delete/Duplicate/Rename/Reorder | `crud()` 모듈 + 개별 옵션 | ✅ |
| 14 | **Command** | defineApp commands + OS commands. Scoped | OS 내장. `with[]` 모듈이 커맨드 자동 등록 | ✅ |
| 15 | **Pipeline** | 표준 OS pipeline (Sense→Intent→Resolve→Commit→Sync→Audit) | OS 내장. Zone 모델과 무관 | ✅ |
| 16 | **ARIA** | role=tree/grid. aria-selected/expanded/checked | OS 자동. `entity` 타입 → ARIA 속성 자동 결정 | ✅ |
| 17 | **App Framework** | defineApp + modules + collection zones | `app.zone()` = defineApp 내부. 모듈은 `with[]` | ✅ |
| 18 | **Verification** | TestPage headless | OS 내장. Zone 모델과 무관 | ✅ |

### 빈칸 분석

**🟡 Field (#6) 상세:**
- 현재 Builder의 Block.fields는 `Record<string, string>` — 모두 string
- Usage Spec v3에서는 `entity` 선언으로 타입 지정 가능
- **미확정**: 블록 타입별로 다른 fields (hero에는 title+subtitle, cards에는 name+description) → **동적 entity schema** 필요
  - 옵션 A: `entity: (item) => schema` (함수형)
  - 옵션 B: `entity: { [blockType]: schema }` (맵형)
  - → **T4에서 설계**

**결과: 18개 중 17개 ✅, 1개 🟡 (Field 동적 schema)**. 빈칸(❌) = 0.

---

## 4. 현행 코드 → Zone 모델 Gap 분석

| 현행 패턴 | Zone 모델 | 차이 |
|-----------|----------|------|
| `createCollectionZone(app, id, config)` | `app.zone(id, { from, to, with: [crud()] })` | Facade 통합. collection이 zone의 한 형태 |
| `collectionConfig.accessor` | `from: (state) => normalize(accessor(state))` | normalize 단계 명시화 |
| `bind({ onReorder, onCopy, ... })` | `with: [reorder(), clipboard()]` | 콜백 → 모듈 |
| `bind({ keybindings: [...] })` | 모듈이 키바인딩 자동 등록 | 수동 → 자동 |
| `createDrillDown/Up` | `hierarchicalNav()` 모듈 | Builder 고유 모듈로 캡슐화 |
| `sidebarCollection.remove/duplicate/moveUp` | `crud()` 모듈 내부 | 메서드 → 모듈 |
| Panel의 selection 구독 (manual useComputed) | `from: (state) => { selection → normalize }` | Master-Detail 자동화 |

### 주요 발견

1. **hierarchicalNav는 Builder 고유 모듈이다.** Canvas의 drillDown/Up + typingEntry는 "grid + tree 계층 탐색"이라는 Builder 특유의 인터랙션. 이것은 OS 보편이 아니라 앱 모듈.

2. **Guard 패턴이 필요하다.** Canvas에서 CRUD를 동적 아이템에만 적용하는 guard. `crud({ guard })` 옵션으로 표현 가능.

3. **Clipboard 커스터마이징이 필수.** Canvas의 구조/텍스트 이중 복사, pasteBubbling은 `clipboard()` 모듈의 hook 옵션으로 표현.

4. **Sidebar와 Canvas가 같은 데이터를 `from`한다.** Cross-zone 동기화 문제: 한쪽에서 수정하면 다른 쪽도 반영되어야 함. `to`가 같은 `state.data.blocks`를 수정하므로 **자동으로 해결**됨 (single source of truth).

---

## 5. Zone 모듈 카탈로그 (T3)

### 모듈 목록

| 모듈 | 역할 | 제공하는 커맨드/키바인딩 | 현행 대응 |
|------|------|------------------------|----------|
| `crud(opts?)` | Create/Delete/Duplicate | `zone:add`, `zone:remove`, `zone:duplicate`. Delete=포커스 복구 포함 | `createCollectionZone` 내부 |
| `reorder()` | 순서 변경 | Alt+↑↓ (list/tree) | `moveUp/moveDown` 커맨드 |
| `reparent()` | 트리 계층 이동 | Alt+←→ (indent/outdent) | `moveLeft/moveRight` (tree만) |
| `clipboard(opts?)` | Copy/Cut/Paste | Ctrl+C/X/V. `onCopy/onCut/onPaste` hook | `collectionBindings` 키바인딩 |
| `select(opts)` | 선택 모드 | `mode: "single"/"multi"`. Shift+Arrow, Ctrl+Click, Ctrl+A | OS 내장 (config.select) |
| `dnd(opts)` | Drag & Drop | `axis: "vertical"/"horizontal"/"2d"`. 드래그 핸들 | PointerListener DnD |
| `activate(fn)` | Enter 동작 | Enter → 앱 콜백. `fn: (item, cursor) => void` | `onAction` 콜백 |
| `history()` | Undo/Redo | Ctrl+Z, Ctrl+Shift+Z. noise filtering 자동 | `history()` app module |
| `deleteToast()` | 삭제 알림 | 삭제 시 자동 toast. Ctrl+Z undo | `deleteToast()` app module |

### 앱 고유 모듈 (OS 보편이 아닌 것)

| 모듈 | 역할 | 소속 |
|------|------|------|
| `hierarchicalNav(opts)` | drillDown/Up + typingEntry | Builder (canvas 전용) |

### 타입 제약 규칙

```typescript
// structure에 따른 모듈 사용 가능 여부
type ModuleConstraints = {
  list:  crud | reorder | clipboard | select | dnd | activate | history;
  tree:  crud | reorder | reparent | clipboard | select | dnd | activate | history;
  grid:  crud | reorder | clipboard | select | dnd | activate | history;
  form:  activate | history;  // Form은 단일 엔티티 → CRUD/reorder 무의미
};
```

**제약 위반 처리**:
- **TypeScript 레벨**: `app.zone("x", { structure: "list", with: [reparent()] })` → 타입 에러
  - `reparent()`는 `TreeModule` 타입. list zone은 `ListModule[]`만 수용
- **런타임 없음**: 타입 시스템이 잘못된 조합을 컴파일 시점에 차단

### 모듈 시그니처 통일

```typescript
// 모든 모듈은 ZoneModule 인터페이스를 구현
interface ZoneModule {
  id: string;
  commands: CommandDef[];         // 모듈이 등록하는 커맨드
  keybindings: KeybindingDef[];   // 모듈이 등록하는 키바인딩
  callbacks?: Partial<ZoneCallbacks>;  // 모듈이 주입하는 콜백
}

// with[]의 각 모듈은 ZoneModule을 리턴하는 팩토리 함수
function crud(opts?: CrudOptions): ZoneModule;
function reorder(): ZoneModule;
function clipboard(opts?: ClipboardOptions): ZoneModule;
```

---

## 6. Entity Schema 설계 (T4)

### 현행 OS FieldType (이미 존재)

```typescript
// packages/os-core/src/engine/registries/fieldRegistry.ts
type FieldType = "inline" | "tokens" | "block" | "editor" | "number" | "enum" | "enum[]" | "readonly";
type FieldValue = string | boolean | number | string[];
```

### Entity Schema → FieldType 매핑

```typescript
// entity 선언에서 OS FieldType으로 자동 매핑
const sidebar = app.zone("sidebar", {
  entity: {
    // string 타입 — mode로 FieldType 결정
    label:       { type: "string", mode: "inline" },   // → FieldType "inline"
    description: { type: "string", mode: "block" },    // → FieldType "block"
    tags:        { type: "string", mode: "tokens" },   // → FieldType "tokens"
    code:        { type: "string", mode: "editor" },   // → FieldType "editor"

    // boolean 타입 — 단일 매핑
    visible:     { type: "boolean" },                   // → OS_CHECK toggle

    // number 타입 — 단일 매핑
    order:       { type: "number", min: 0, max: 100 }, // → FieldType "number"

    // enum 타입 — OS 내장 (options 제공)
    status:      { type: "enum", options: ["draft", "published", "archived"] },
    // → FieldType "enum", select/radiogroup UI

    // enum[] 타입 — 다중 선택
    categories:  { type: "enum[]", options: ["news", "blog", "tutorial"] },
    // → FieldType "enum[]", checkbox group UI
  },
});
```

### 타입 매핑 표

| entity type | entity mode | OS FieldType | OS FieldValue | ARIA role |
|-------------|-------------|-------------|---------------|-----------|
| `string` | `inline` | `inline` | `string` | textbox |
| `string` | `tokens` | `tokens` | `string` | textbox (chips) |
| `string` | `block` | `block` | `string` | textbox (multiline) |
| `string` | `editor` | `editor` | `string` | textbox (contentEditable) |
| `boolean` | — | (OS_CHECK) | `boolean` | switch/checkbox |
| `number` | — | `number` | `number` | spinbutton/slider |
| `enum` | — | `enum` | `string` | listbox/radiogroup/select |
| `enum[]` | — | `enum[]` | `string[]` | checkbox group |

### OS 내장 vs 앱 커스텀 경계

| 타입 | OS 내장? | 근거 |
|------|:--------:|------|
| string (4 modes) | ✅ | 이미 FieldType에 존재 |
| boolean | ✅ | OS_CHECK 커맨드 존재 |
| number | ✅ | OS_VALUE_CHANGE 커맨드 존재 |
| enum / enum[] | ✅ | FieldType에 존재. options로 선택지 제공 |
| **color** | ❌ 앱 커스텀 | 색상 피커 UI는 OS 관할 밖. 내부적으로 string(hex) |
| **date** | ❌ 앱 커스텀 | 달력 UI는 OS 관할 밖. 내부적으로 string(ISO) |
| **relation** | ❌ 앱 커스텀 | 다른 엔티티 참조. 앱 도메인 의존 |

**결론**: color/date/relation은 **앱이 커스텀 Field 컴포넌트로 구현**하되, 내부 저장 값은 OS FieldValue의 string/number로 표현. OS는 키 소유권(FieldType)만 관리.

### 동적 Entity Schema (Builder 특유 문제)

Builder의 Block.fields는 블록 타입별로 다른 키를 가짐:
- hero: `{ title, subtitle, buttonText }`
- cards: `{ name, description }`

**해법**: entity를 함수로 선언

```typescript
const canvas = app.zone("canvas", {
  entity: (item) => {
    // item.fields의 실제 키에서 schema를 동적 생성
    return Object.fromEntries(
      Object.keys(item.fields).map(key => [key, { type: "string", mode: "inline" }])
    );
  },
});
```

**타입 안전성**: 동적 entity 함수의 리턴 타입은 `Record<string, EntityFieldDef>`. 개별 필드 타입은 런타임에 결정되므로 TypeScript 레벨 자동완성은 포기. Builder처럼 CMS 도구만 이 패턴 사용. 일반 앱은 정적 entity 선언.

---

## 7. 보편성 검증 — Todo & Kanban (T5)

### 7-A. Todo Usage Spec

현행 Todo: 6 zones (list/sidebar/draft/edit/search/toolbar). 이미 `fromEntities()` + `createCollectionZone` 사용.

```typescript
const TodoApp = defineApp("todo", INITIAL_STATE, { modules: [history()] });

// ── List Zone (CRUD + clipboard + ordering) ──
const list = app.zone("list", {
  structure: "list",
  from: (state) => normalizeEntities(state.data.todos, state.data.todoOrder),
  to: (state, n) => ({
    ...state,
    data: { ...state.data, todos: denormalize(n).byId, todoOrder: denormalize(n).allIds },
  }),
  entity: {
    text:      { type: "string", mode: "inline" },
    completed: { type: "boolean" },
  },
  with: [
    crud({ create: (payload) => ({ text: payload.text, completed: false }) }),
    reorder(),
    clipboard({ onPaste: (item, state) => ({ ...item, categoryId: state.ui.selectedCategoryId }) }),
    select({ mode: "multi" }),
    dnd({ axis: "vertical" }),
    activate((item) => startEdit(item)),
    history(),
  ],
});

// ── Sidebar Zone (카테고리 선택) ──
const sidebar = app.zone("sidebar", {
  structure: "list",
  from: (state) => normalizeEntities(state.data.categories, state.data.categoryOrder),
  // to 없음 → 읽기 전용 (선택만)
  with: [
    select({ mode: "single", followFocus: true }),
    activate((item) => selectCategory(item)),
    reorder(),  // 카테고리 순서 변경
  ],
});

// ── Draft Zone (입력 필드) ──
const draft = app.zone("draft", {
  structure: "form",
  field: { name: "DRAFT", trigger: "enter", resetOnSubmit: true },
  with: [activate((_, value) => list.add({ text: value }))],
});

// ── Edit Zone (편집 필드) ──
const edit = app.zone("edit", {
  structure: "form",
  field: { trigger: "enter", onCancel: cancelEdit() },
  with: [activate((_, value) => updateTodoText({ text: value }))],
});

// ── Search Zone (검색 필드) ──
const search = app.zone("search", {
  structure: "form",
  field: { trigger: "change", onCancel: clearSearch() },
  with: [activate((_, value) => setSearchQuery({ text: value }))],
});

// ── Toolbar Zone ──
const toolbar = app.zone("toolbar", {
  structure: "list",  // toolbar items
  keybindings: [{ key: "Meta+Shift+V", command: toggleView }],
});
```

**보편성 검증 결과**: ✅ Todo의 6 zones 전부 Zone 모델로 표현 가능.

### 7-B. Kanban Usage Spec (가상)

Kanban 앱은 존재하지 않으므로 가상 설계.

```typescript
const KanbanApp = defineApp("kanban", INITIAL_STATE, { modules: [history()] });

// ── Board Zone (칸반 보드 = depth-1 tree) ──
const board = app.zone("board", {
  structure: "tree",
  from: (state) => normalizeKanban(state.data.columns),
  to: (state, n) => ({ ...state, data: { columns: denormalizeKanban(n) } }),
  entity: {
    title: { type: "string", mode: "inline" },
  },
  with: [
    crud(),                              // 카드/열 추가/삭제
    reorder(),                           // 카드 순서 변경 (같은 열 내)
    reparent(),                          // 카드 열 간 이동
    clipboard(),
    select({ mode: "multi" }),
    dnd({ axis: "2d" }),                 // 2D 드래그 (열 간 이동)
    activate((item) => openDetail(item)),
    history(),
  ],
  navigate: { orientation: "corner" },   // 2D 네비게이션
});

// ── Card Detail Zone (선택된 카드 상세) ──
const detail = app.zone("card-detail", {
  structure: "form",
  from: (state) => normalizeCardDetail(board.selectedItem(state)),
  to: (state, n) => updateCard(state, n),
  entity: {
    title:       { type: "string", mode: "inline" },
    description: { type: "string", mode: "block" },
    assignee:    { type: "enum", options: TEAM_MEMBERS },
    priority:    { type: "enum", options: ["low", "medium", "high", "critical"] },
    dueDate:     { type: "string", mode: "inline" },  // date는 앱 커스텀 (T4 결론)
  },
  with: [history()],
});
```

**보편성 검증 결과**: ✅ Kanban도 Zone 모델로 자연스럽게 표현. depth-1 tree + reparent() = 열 간 이동.

### 7-C. 3앱 비교표

| 기능 | Builder | Todo | Kanban |
|------|---------|------|--------|
| structure | tree, grid | list | tree (depth-1) |
| from/to | ✅ | ✅ | ✅ |
| entity | ✅ (동적) | ✅ (정적) | ✅ (정적) |
| crud | ✅ | ✅ | ✅ |
| reorder | ✅ | ✅ | ✅ |
| reparent | ✅ | ❌ (flat) | ✅ |
| clipboard | ✅ (커스텀) | ✅ | ✅ |
| select | multi | multi | multi |
| dnd | ✅ | ✅ | ✅ (2D) |
| history | ✅ | ✅ | ✅ |
| Field zones | textbox (inline) | textbox (draft/edit/search) | form (detail) |
| Overlay | locale menu | delete dialog | card detail |

**결론**: Zone+from/to+with[] 모델이 3개 앱 모두 보편적으로 적용됨. **모델 수정 불필요**.

---

## 8. Trigger → 순수 투영 프리미티브 (T7)

### 현황

Trigger는 현재 두 가지 역할을 겸한다:
1. **ARIA 투영** (aria-haspopup, aria-expanded, aria-controls) — 순수 계산 가능
2. **Overlay 렌더링** (Portal, Popover, Dismiss, Dialog) — React DOM 필수

Item이 `computeItem` 순수 함수로 ARIA를 계산하는 것처럼, Trigger도 `computeTrigger`로 분리해야 한다.

### 이미 완료된 것

- **`computeTrigger(kernel, triggerId)`**: `packages/os-core/src/3-inject/compute.ts`에 이미 구현됨
  - `TriggerOverlayRegistry.get(triggerId)` → overlay 메타데이터 조회
  - `overlays.stack` → `aria-expanded` 계산
  - 순수 함수. React 의존 없음.
- **`resolveElement()`**: Item + Trigger ARIA 자동 병합. headless 테스트에서 `page.attrs(triggerId)`로 검증 가능.
- **`TriggerConfig` (축 분리 프리셋)**: `triggerRegistry.ts`에 6개 preset (menu, dialog, alertdialog, listbox, popover, tooltip)
  - `open: { onActivate, onClick, onArrowDown, onArrowUp, onHover }`
  - `focus: { onOpen, onClose }`
  - `aria: { haspopup }`
- **`buildTriggerKeymap()`**: TriggerConfig → Keymap 변환. overlay 열림/닫힘 키 자동 생성.

### 목표 모델 (미구현)

```typescript
// ── 통일된 Trigger 선언 ──
const deleteDialog = app.trigger("delete-dialog", {
  role: "alertdialog",                          // TriggerConfig 프리셋 자동 적용
  confirm: DELETE_CONFIRMED(),                   // 확인 커맨드
});

const localeMenu = app.trigger("locale-menu", {
  role: "menu",                                  // TriggerConfig 프리셋 자동 적용
});

// ── Trigger는 순수 투영만 ──
// ARIA: computeTrigger(kernel, "locale-menu-trigger")
//   → { "aria-haspopup": "menu", "aria-expanded": true, "aria-controls": "locale-menu" }

// ── Overlay 렌더링은 별도 프리미티브 ──
// <Overlay id="delete-dialog" role="alertdialog">
//   <Overlay.Content> ... </Overlay.Content>
// </Overlay>
//
// <Overlay id="locale-menu" role="menu">
//   <Zone id="locale-menu" role="menu"> ... </Zone>
// </Overlay>
```

### 분리 계획 (3 Phase)

| Phase | 내용 | 상태 |
|-------|------|:----:|
| 1 | `computeTrigger` headless 순수 계산 | ✅ 완료 |
| 2 | Portal/Popover/Dismiss → `<Overlay>` 프리미티브로 분리 | 미착수 |
| 3 | Trigger.tsx 슬림화 (ARIA 투영 only) | 미착수 |

### 핵심 원칙

1. **Trigger = Item과 동격의 순수 투영 프리미티브.** overlay 메타데이터를 등록하고, ARIA를 headless 순수 계산한다.
2. **렌더링(Portal/Popover/Dismiss)은 Trigger의 책임이 아니다.** OS/Overlay 프리미티브로 분리한다.
3. **모든 overlay trigger는 `app.trigger()` 경유로 통일한다.** 개별 `<Trigger role="menu">` 직접 사용 제거.
4. **TriggerConfig (축 분리 프리셋)** — Zone의 rolePreset과 동형. 새 overlay role 추가 시 분기 0.
