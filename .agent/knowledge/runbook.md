# OS Runbook — 앱을 OS 위에서 만드는 법

> **이 문서는 LLM이 매 세션 읽는 온보딩 매뉴얼이다.**
> 모든 앱 개발의 목적은 앱의 완성이 아니라 **OS의 완성**이다.
> 앱은 OS가 제대로 동작하는지 증명하는 수단이다.

---

## 0. 왜 이 OS가 존재하는가

웹은 앱이 아니다. 브라우저의 focus, selection, undo, keyboard navigation은 앱 수준에 부족하다.
LLM이 개발하려면 시스템을 관찰할 수 있어야 한다. 브라우저는 그 관찰 수단을 제공하지 않는다.
이 OS는 이 두 가지를 해결한다: **앱 수준의 상호작용**과 **LLM이 개발할 수 있는 관찰 가능한 환경**.

---

## 1. OS 구조 한눈 요약

```
입력(Key/Mouse/Clipboard)
  → Listener (감지 + 번역)
  → Command (의도 실행)
  → State (커널 상태 변경)
  → Component (Zone/Item/Field/Trigger로 투사)
```

### ZIFT 프리미티브

| 프리미티브 | 역할 | 예시 |
|-----------|------|------|
| **Zone** | 포커스 영역. 키보드 네비게이션의 단위 | `<Zone {...TodoListUI}>` |
| **Item** | Zone 안의 개별 항목. 포커스/선택의 대상 | `<Item id="todo-1">` |
| **Field** | 편집 가능한 입력. commit/cancel 파이프라인 | `<Field.Editable>` |
| **Trigger** | 오버레이(Dialog/Menu/Popover) 트리거 | `<Trigger.Portal>` |

---

## 2. 앱 만드는 5단계

### Step 1: defineApp으로 앱 선언

```typescript
import { defineApp } from "@/os/defineApp";

export const MyApp = defineApp<AppState>("my-app", INITIAL_STATE, {
  history: true,  // undo/redo 지원 시
});
```

### Step 2: 상태(State) 설계

도메인 데이터와 UI 상태를 분리한다:

```typescript
interface AppState {
  data: { items: Record<string, Item>; order: string[] };
  ui: { selectedId: string | null; viewMode: "list" | "board" };
  history: HistoryState;
}
```

### Step 3: 커맨드(Command) 정의

커맨드 핸들러는 `(ctx) => (payload?) => EffectMap` 커링 형태:

```typescript
const toggleItem = zone.command(
  "toggleItem",
  (ctx, payload: { id: string }) => ({
    state: produce(ctx.state, (draft) => {
      const item = draft.data.items[payload.id];
      if (item) item.done = !item.done;
    }),
  }),
);
```

### Step 4: Zone 바인딩

Zone을 만들고 role, 콜백, 키바인딩을 선언한다:

```typescript
const listZone = MyApp.createZone("list");

export const MyListUI = listZone.bind({
  role: "listbox",                              // ARIA role → OS 기본 동작 결정
  options: { dismiss: { escape: "deselect" } }, // OS 설정 오버라이드
  onAction: (cursor) => doSomething({ id: cursor.focusId }),
  onCheck: (cursor) => toggleItem({ id: cursor.focusId }),
  onDelete: (cursor) => deleteItem({ id: cursor.focusId }),
  onUndo: undoCommand(),
  onRedo: redoCommand(),
  keybindings: [...],
});
```

**CRUD가 있는 Zone은 `createCollectionZone`을 쓴다**:

```typescript
import { createCollectionZone, fromEntities } from "@/os/collection/createCollectionZone";

const collection = createCollectionZone(MyApp, "list", {
  ...fromEntities(
    (s: AppState) => s.data.items,
    (s: AppState) => s.data.order,
  ),
  create: (payload: { text: string }) => ({ id: uid(), text: payload.text }),
  text: (item: Item) => item.text,
});

// 자동 제공: collection.add, .remove, .moveUp, .moveDown,
//           .copy, .cut, .paste, .duplicate, .collectionBindings()
```

### Step 5: 뷰(Widget) 바인딩

Widget은 Zone/Item/Field로 UI를 투사한다. **useState, useEffect, onClick 금지**:

```tsx
function MyList() {
  const items = MyApp.useSelector(visibleItems);
  return (
    <Zone {...MyListUI}>
      {items.map(item => (
        <Item key={item.id} id={item.id}>
          <Item.CheckTrigger>
            <Checkbox checked={item.done} />
          </Item.CheckTrigger>
          <span>{item.text}</span>
        </Item>
      ))}
    </Zone>
  );
}
```

---

## 3. 벤치마크: Todo 앱 해부

> `src/apps/todo/app.ts` — 모든 패턴의 참조 구현

```
TodoApp (defineApp)
  ├── Conditions: canUndo, canRedo, isEditing
  ├── Selectors: visibleTodos, categories, stats
  ├── Zones:
  │   ├── list     — listbox (CRUD, clipboard, ordering, undo/redo)
  │   │              createCollectionZone + fromEntities
  │   ├── sidebar  — listbox (category selection + ordering)
  │   ├── draft    — textbox (Field: onCommit → addTodo, trigger: "enter")
  │   ├── edit     — textbox (Field: onCommit → updateTodoText, onCancel → cancelEdit)
  │   ├── search   — textbox (Field: onCommit → setSearchQuery, trigger: "change")
  │   └── toolbar  — toolbar (keybindings: Meta+Shift+V → toggleView)
```

**학습 포인트**:
- `createCollectionZone` + `fromEntities` → CRUD/Clipboard/Ordering 자동
- `collectionBindings()` → getItems, onMoveUp/Down, onCopy/Cut/Paste 자동 바인딩
- `collection.command()` → 컬렉션 스코프에 커맨드 추가
- `createTrigger()` → 타입 안전한 트리거 생성

---

## 4. 절대 하지 않는 것

| ❌ 금지 | ✅ 대안 |
|---------|---------|
| `useState`로 상태 관리 | `defineApp` + 커맨드로 커널 상태 관리 |
| `useEffect`로 부수 효과 | 커맨드의 Effect Map (`[FOCUS_ID]: targetId`) |
| `onClick` 핸들러 | Zone의 `onAction`, `onCheck`, `onDelete` 콜백 |
| `document.querySelector` | 커맨드 ctx.inject() 또는 커널 state |
| `addEventListener("keydown")` | OS KeyboardListener → 커맨드 파이프라인 |
| Testing Library `render()` | `createOsPage()` headless 테스트 |

**판단 기준**: "이것을 순수 React로 만들 수 있는가?"
- **YES** → OS가 부족하다. OS에 뭘 추가해야 하는지 먼저 고민
- **NO, OS로 표현 가능** → OS 방식으로 설계

---

## 5. Headless 검증 패턴

### createOsPage — OS 전용 headless 테스트

```typescript
import { createOsPage } from "@os/createOsPage";

test("Arrow Down moves focus", () => {
  const page = createOsPage();
  page.goto("my-zone", { items: ["a", "b", "c"], role: "listbox" });

  page.press("ArrowDown");
  expect(page.focusedItemId()).toBe("b");

  page.press("ArrowDown");
  expect(page.focusedItemId()).toBe("c");
});
```

### OsPage API 요약

| 메서드 | 역할 |
|--------|------|
| `page.goto(zoneId, opts)` | Zone에 진입. items, role, config 설정 |
| `page.press(key)` | 키 입력 시뮬레이션 |
| `page.click(itemId, opts?)` | 클릭 시뮬레이션 (shift/meta/ctrl) |
| `page.attrs(itemId)` | ARIA 속성 조회 (focused, selected, expanded 등) |
| `page.focusedItemId()` | 현재 포커스된 아이템 ID |
| `page.selection()` | 선택된 아이템 목록 |
| `page.activeZoneId()` | 활성 Zone ID |
| `page.dispatch(cmd)` | 커맨드 직접 디스패치 |

### Red→Green 사이클

```typescript
// 1. Red — 기대 동작을 먼저 테스트로 작성
test("Enter activates item", () => {
  const page = createOsPage();
  const onAction = vi.fn();
  page.goto("zone", { items: ["a", "b"], role: "listbox", onAction });

  page.press("Enter");
  expect(onAction).toHaveBeenCalled();  // 🔴 Red
});

// 2. Green — OS 커맨드/설정을 구현하여 통과
// 3. Refactor — 패턴 일반화
```

---

## 더 깊이 알고 싶을 때

> 아래는 **읽으라는 게 아니다.** 필요한 상황에서 찾아가는 지도다.

### OS 동작 계약

| 상황 | 참조 |
|------|------|
| Role별 키보드 동작이 궁금할 때 | `docs/official/os/SPEC.md` §7 Role Preset Matrix |
| 커맨드 목록/페이로드 확인 | `docs/official/os/SPEC.md` §3 Commands |
| 키맵(어떤 키 → 어떤 커맨드) 확인 | `docs/official/os/SPEC.md` §6 Keymap |
| Focus/Selection/Expand 상태 구조 | `docs/official/os/SPEC.md` §2 State |
| OS가 왜 이 기능을 직접 하는지 | `docs/official/os/why-*.md` (focus, navigation, clipboard 등) |

### 커널 API

| 상황 | 참조 |
|------|------|
| createKernel, defineCommand 기초 | `docs/official/kernel/01-getting-started.md` |
| Command, Effect, Scope 개념 | `docs/official/kernel/02-core-concepts.md` |
| 미들웨어 작성법 | `docs/official/kernel/06-middleware.md` |
| 테스트 패턴 (격리, 트랜잭션 어설션) | `docs/official/kernel/08-patterns.md` |

### 앱 구현 패턴

| 상황 | 참조 |
|------|------|
| CRUD/Clipboard/Ordering 전체 패턴 | `src/apps/todo/app.ts` (벤치마크) |
| Tree 네비게이션, 계층 구조 | `src/apps/builder/app.ts` + `src/docs-viewer/app.ts` |
| Dialog/Menu/Overlay 패턴 | `docs/2-area/20-os/23-6-project/02-primitives-detail.md` |
| LLM이 잘 쓰는 API 설계 원칙 | `docs/2-area/20-os/23-6-project/03-llm-friendly-design.md` |

### 테스트

| 상황 | 참조 |
|------|------|
| createOsPage 전체 API | `packages/os-devtool/src/testing/createOsPage.ts` (OsPage interface) |
| APG 계약 테스트 사례 | `tests/apg/*.apg.test.ts` |
| 앱 통합 테스트 사례 | `src/apps/todo/tests/` |

