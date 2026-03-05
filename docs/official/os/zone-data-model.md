# Zone Data Model — app.zone() API

> **상태**: Design Spike 완료 (T1-T5 검증). 구현 전.
> **범위**: defineApp 수준에서 Zone의 데이터 바인딩 + 모듈 합성 API.
> **관계**: ZIFT React 컴포넌트(`<Zone>`, `<Item>`, `<Field>`, `<Trigger>`)와 상보적. React 레이어와 전체 ZIFT 명세는 `zift-spec.md` 참조 (canonical ZIFT 문서).

---

## 1. 핵심 모델

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

## 2. API 시그니처

```typescript
app.zone(id: string, config: ZoneConfig): ZoneHandle;

interface ZoneConfig {
  structure: "list" | "tree" | "grid" | "form";

  // 데이터 바인딩
  from?: (state: AppState) => NormalizedCollection;
  to?: (state: AppState, normalized: NormalizedCollection) => AppState;

  // 스키마
  entity?: EntitySchema | ((item: NormalizedItem) => EntitySchema);

  // 모듈 합성
  with?: ZoneModule[];

  // Zone 동작 설정 (선택)
  navigate?: { orientation?: "vertical" | "horizontal" | "corner"; typeahead?: boolean };
  tab?: { behavior?: "trap" | "flow" | "escape" };
  select?: { mode?: "single" | "multi"; followFocus?: boolean };
  activate?: { onClick?: boolean; reClickOnly?: boolean };
  dismiss?: { escape?: "close" | "none" };
}
```

---

## 3. NormalizedStore

모든 Zone 구조(list, tree, grid, form)가 하나의 shape으로 정규화된다.

```typescript
interface NormalizedStore {
  items: Record<string, NormalizedItem>;
  zones: Record<string, ZoneDef>;
}

interface NormalizedItem {
  id: string;
  fields: Record<string, FieldValue>;
  parentId: string | null;       // null = zone의 루트
  childIds: string[];            // 정렬된 자식 (없으면 [])
  zoneId: string;
}

interface ZoneDef {
  id: string;
  structure: "list" | "tree" | "grid" | "form";
  rootIds: string[];             // 최상위 아이템 (정렬됨)
  parentItemId?: string;         // nested zone일 때
  columns?: ColumnDef[];         // grid일 때
}
```

**검증**: 7가지 구조 전수 검증 완료 — List, Tree, Grid, Kanban(depth-1 tree), Form, Dropdown, Nested Zone.

---

## 4. Entity Schema → FieldType 매핑

```typescript
type EntitySchema = Record<string, EntityFieldDef>;

type EntityFieldDef =
  | { type: "string"; mode: "inline" | "tokens" | "block" | "editor" }
  | { type: "boolean" }
  | { type: "number"; min?: number; max?: number }
  | { type: "enum"; options: string[] }
  | { type: "enum[]"; options: string[] };
```

| entity type | entity mode | OS FieldType | ARIA role |
|-------------|-------------|-------------|-----------|
| `string` | `inline` | `inline` | textbox |
| `string` | `tokens` | `tokens` | textbox (chips) |
| `string` | `block` | `block` | textbox (multiline) |
| `string` | `editor` | `editor` | textbox (contentEditable) |
| `boolean` | — | (OS_CHECK) | switch/checkbox |
| `number` | — | `number` | spinbutton/slider |
| `enum` | — | `enum` | listbox/radiogroup |
| `enum[]` | — | `enum[]` | checkbox group |

**OS 외부**: color, date, relation은 앱 커스텀. 내부 저장 값은 string/number.

---

## 5. Zone 모듈 카탈로그

### OS 보편 모듈 (9개)

| 모듈 | 역할 | 키바인딩 |
|------|------|---------|
| `crud(opts?)` | Create/Delete/Duplicate | Delete, Ctrl+D |
| `reorder()` | 순서 변경 | Alt+↑↓ |
| `reparent()` | 트리 계층 이동 | Alt+←→ |
| `clipboard(opts?)` | Copy/Cut/Paste | Ctrl+C/X/V |
| `select(opts)` | 선택 모드 | Shift+Arrow, Ctrl+Click |
| `dnd(opts)` | Drag & Drop | 마우스/터치 |
| `activate(fn)` | Enter 동작 | Enter |
| `history()` | Undo/Redo | Ctrl+Z, Ctrl+Shift+Z |
| `deleteToast()` | 삭제 알림 | (자동) |

### Structure별 모듈 타입 제약

```typescript
type ModuleConstraints = {
  list:  crud | reorder | clipboard | select | dnd | activate | history;
  tree:  crud | reorder | reparent | clipboard | select | dnd | activate | history;
  grid:  crud | reorder | clipboard | select | dnd | activate | history;
  form:  activate | history;
};
```

- `reparent()`는 tree 전용. list/grid에서 사용 시 TypeScript 컴파일 에러.
- 제약은 타입 시스템으로 강제. 런타임 검사 없음.

### 모듈 인터페이스

```typescript
interface ZoneModule {
  id: string;
  commands: CommandDef[];
  keybindings: KeybindingDef[];
  callbacks?: Partial<ZoneCallbacks>;
}
```

---

## 6. 보편성 검증 결과

3개 앱(Builder, Todo, Kanban)으로 검증. 모델 수정 불필요.

| 기능 | Builder | Todo | Kanban |
|------|---------|------|--------|
| structure | tree, grid | list | tree (depth-1) |
| from/to | ✅ | ✅ | ✅ |
| entity | 동적 | 정적 | 정적 |
| crud | ✅ | ✅ | ✅ |
| reorder | ✅ | ✅ | ✅ |
| reparent | ✅ (tree) | — | ✅ |
| clipboard | 커스텀 hooks | ✅ | ✅ |
| dnd | ✅ | ✅ | 2D |

---

## 7. 미확정

- `entity`가 함수(동적 schema)인 경우 타입 안전성 보장 방법
- `<sidebar.View />` 자동 생성 UI가 ZIFT 범위인가
- 여러 zone이 같은 데이터를 `from`하면 동기화 메커니즘
- Zone 모듈의 조합 규칙 (잘못된 조합 = 타입 에러? 런타임 에러?)
