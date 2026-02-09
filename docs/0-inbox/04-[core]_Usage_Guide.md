# Core Library Usage Guide

> 날짜: 2026-02-09
> 태그: core, usage, API
> 상태: Draft
> 선행 문서: 01-[re-frame] 제안서, 03-[naming] 네이밍 컨벤션

---

## 1. 설치와 셋업

```typescript
import {
  createStore,
  dispatch,
  defineHandler,
  defineCommand,
  defineEffect,
  defineContext,
  defineQuery,
  inject,
  use,
} from "@os/core";

import { useQuery, useDispatch } from "@os/react";
```

### 스토어 초기화

```typescript
const store = createStore({
  focus: {
    activeZoneId: null,
    focusStack: [],
    zones: {},
  },
  app: {
    activeAppId: null,
  },
  input: {
    source: "programmatic",
  },
});
```

---

## 2. 핸들러 정의

### `defineHandler` — 상태만 변경하는 순수 핸들러

상태를 받아서 새 상태를 반환하는 가장 단순한 형태.
Redux의 reducer, re-frame의 `reg-event-db`와 같은 역할.

```typescript
defineHandler("set-theme", (db, theme: "light" | "dark") => ({
  ...db,
  ui: { ...db.ui, theme },
}));

defineHandler("set-active-zone", (db, zoneId: string | null) => ({
  ...db,
  focus: { ...db.focus, activeZoneId: zoneId },
}));
```

**규칙:**
- `db`를 직접 변이하지 않는다 (Immer 사용 시 변이 가능)
- 부수효과 없음. DOM 접근 없음. fetch 없음.
- 새 상태 객체를 반환한다

### `defineCommand` — 이펙트를 선언하는 커맨드

상태 변경과 함께 DOM 조작, 비동기 작업 등의 부수효과를 **데이터로 선언**하는 형태.
re-frame의 `reg-event-fx`와 같은 역할.

```typescript
defineCommand("navigate", (ctx, payload: { direction: Direction }) => {
  const { db } = ctx;
  const zone = db.focus.zones[db.focus.activeZoneId!];
  const items = ctx["dom-items"];
  const nextId = findNext(items, zone.focusedItemId, payload.direction);

  return {
    db: updateZone(db, db.focus.activeZoneId!, { focusedItemId: nextId }),
    focus: nextId,
    scroll: nextId,
  };
});
```

**반환값은 `EffectMap`** — 각 키가 이펙트 이름, 값이 이펙트 인자:

```typescript
type EffectMap = {
  db?: DB;                    // 상태 업데이트
  dispatch?: Event;           // 다른 이벤트 발행
  defer?: { event: Event; ms: number };  // 지연 발행
  focus?: string;             // DOM 포커스
  scroll?: string;            // DOM 스크롤
  clipboard?: string;         // 클립보드 쓰기
  [custom: string]: unknown;  // 앱 정의 이펙트
};
```

### 컨텍스트가 필요한 커맨드

DOM 정보, zone config 등 외부 데이터가 필요하면 `inject`로 선언한다:

```typescript
defineCommand(
  "navigate",
  [inject("dom-items"), inject("dom-rects"), inject("zone-config")],
  (ctx, payload) => {
    // ctx.db        — 항상 있음 (자동)
    // ctx["dom-items"]  — inject로 요청한 것
    // ctx["dom-rects"]  — inject로 요청한 것
    // ctx["zone-config"] — inject로 요청한 것

    const items = ctx["dom-items"] as string[];
    const config = ctx["zone-config"] as FocusGroupConfig;
    // ...
  }
);
```

---

## 3. 이펙트 정의

### `defineEffect` — 부수효과 실행기 등록

커맨드가 반환한 `EffectMap`의 각 키를 실제로 실행하는 핸들러.

```typescript
// 내장 이펙트
defineEffect("db", (nextDb) => {
  store.setState({ db: nextDb });
});

defineEffect("dispatch", (event) => {
  dispatch(event);
});

defineEffect("defer", ({ event, ms }) => {
  setTimeout(() => dispatch(event), ms);
});

// DOM 이펙트
defineEffect("focus", (targetId: string) => {
  document.getElementById(targetId)?.focus({ preventScroll: true });
});

defineEffect("scroll", (targetId: string) => {
  document.getElementById(targetId)?.scrollIntoView({
    block: "nearest",
    inline: "nearest",
  });
});

defineEffect("clipboard", async (text: string) => {
  await navigator.clipboard.writeText(text);
});
```

### 앱에서 커스텀 이펙트 추가

```typescript
defineEffect("toast", (message: string) => {
  toastStore.add({ message, duration: 3000 });
});

defineEffect("analytics", (event: AnalyticsEvent) => {
  posthog.capture(event.name, event.properties);
});

defineEffect("http", async ({ url, method, onSuccess, onFailure }) => {
  try {
    const res = await fetch(url, { method });
    const data = await res.json();
    dispatch({ type: onSuccess, payload: data });
  } catch (err) {
    dispatch({ type: onFailure, payload: err });
  }
});
```

---

## 4. 컨텍스트 정의

### `defineContext` — 읽기 전용 데이터 제공자

커맨드가 `inject`로 요청할 수 있는 외부 데이터 소스.
DOM 쿼리처럼 비용이 드는 데이터를 **필요한 커맨드에서만** 수집.

```typescript
defineContext("dom-items", () => {
  const zoneId = store.getState().db.focus.activeZoneId;
  if (!zoneId) return [];
  const el = document.getElementById(zoneId);
  if (!el) return [];
  return Array.from(el.querySelectorAll("[data-focus-item]")).map((e) => e.id);
});

defineContext("dom-rects", () => {
  const items = resolveContext("dom-items") as string[];
  return new Map(
    items.map((id) => [id, document.getElementById(id)!.getBoundingClientRect()])
  );
});

defineContext("zone-config", () => {
  const zoneId = store.getState().db.focus.activeZoneId;
  return zoneRegistry.get(zoneId)?.config ?? defaultConfig;
});

defineContext("focus-path", () => {
  const db = store.getState().db;
  const path: string[] = [];
  let current = db.focus.activeZoneId;
  while (current) {
    path.unshift(current);
    current = db.focus.zones[current]?.parentId ?? null;
  }
  return path;
});
```

---

## 5. 쿼리 정의

### `defineQuery` — 파생 상태 구독

컴포넌트가 구독할 수 있는 **캐싱된 파생 상태**. db가 바뀔 때만 재계산.

```typescript
// Layer 2: db에서 직접 추출
defineQuery("active-zone-id", (db) => db.focus.activeZoneId);

defineQuery("zone-state", (db, [_, zoneId]) => db.focus.zones[zoneId]);

defineQuery("focused-item", (db, [_, zoneId]) =>
  db.focus.zones[zoneId]?.focusedItemId
);

defineQuery("selection", (db, [_, zoneId]) =>
  db.focus.zones[zoneId]?.selection ?? []
);

// Layer 3: 다른 쿼리를 조합 (파생의 파생)
defineQuery(
  "is-focused",
  (args) => [["focused-item", args[1]]],
  ([focusedItemId], [_, _zoneId, itemId]) => focusedItemId === itemId
);

defineQuery(
  "is-selected",
  (args) => [["selection", args[1]]],
  ([selection], [_, _zoneId, itemId]) => selection.includes(itemId)
);

defineQuery(
  "can-navigate",
  (args) => [["zone-state", args[1]]],
  ([zone]) => zone != null && zone.focusedItemId != null
);
```

### 컴포넌트에서 사용

```tsx
function FocusItem({ id }: { id: string }) {
  const { groupId } = useFocusGroupContext();
  const isFocused = useQuery(["is-focused", groupId, id]);
  const isSelected = useQuery(["is-selected", groupId, id]);

  return (
    <li
      role="option"
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      data-focused={isFocused}
    >
      {/* ... */}
    </li>
  );
}
```

---

## 6. 미들웨어

### `use` — 글로벌 미들웨어 등록

모든 이벤트에 적용되는 cross-cutting concern.

```typescript
const transaction: Middleware = {
  id: "transaction",
  before: (context) => {
    context.snapshot = takeSnapshot();
    return context;
  },
  after: (context) => {
    const before = context.snapshot;
    const after = takeSnapshot();
    TransactionLog.add({
      event: context.event,
      diff: computeDiff(before, after),
      timestamp: Date.now(),
    });
    return context;
  },
};

use(transaction);
```

```typescript
// 개발 환경 전용 로깅
if (import.meta.env.DEV) {
  use({
    id: "logger",
    before: (context) => {
      console.group(`[dispatch] ${context.event.type}`);
      console.log("payload:", context.event.payload);
      console.log("db before:", context.coeffects.db);
      return context;
    },
    after: (context) => {
      console.log("effects:", context.effects);
      console.groupEnd();
      return context;
    },
  });
}
```

### 커맨드별 미들웨어

특정 커맨드에만 적용하는 미들웨어는 `defineCommand`의 인터셉터 배열에 넣는다:

```typescript
const stickyCoord: Middleware = {
  id: "sticky-coord",
  after: (context) => {
    // navigate 결과에서 sticky 좌표 자동 계산
    const fx = context.effects;
    if (fx.focus) {
      const rect = document.getElementById(fx.focus)?.getBoundingClientRect();
      if (rect) {
        fx.db = updateZone(fx.db, activeZoneId, {
          stickyX: rect.left + rect.width / 2,
          stickyY: rect.top + rect.height / 2,
        });
      }
    }
    return context;
  },
};

defineCommand(
  "navigate",
  [inject("dom-items"), inject("zone-config"), stickyCoord],
  handler
);
```

---

## 7. 이벤트 발행

### `dispatch` — 단일 진입점

```typescript
// 센서에서
dispatch({ type: "navigate", payload: { direction: "down" } });
dispatch({ type: "activate", payload: { targetId: "item-3" } });
dispatch({ type: "select", payload: { targetId: "item-3", mode: "toggle" } });
dispatch({ type: "escape" });

// 앱 로직에서
dispatch({ type: "todo/toggle-done", payload: { id: "todo-1" } });
dispatch({ type: "kanban/move-card", payload: { cardId: "c1", columnId: "col-2" } });
```

### React 컴포넌트에서

```tsx
function TodoItem({ todo }: { todo: Todo }) {
  const send = useDispatch();

  return (
    <li>
      <button
        type="button"
        onClick={() => send({ type: "todo/toggle-done", payload: { id: todo.id } })}
      >
        {todo.title}
      </button>
    </li>
  );
}
```

---

## 8. 실전 예제: Todo 앱

### 상태 정의

```typescript
interface TodoState {
  items: Record<string, Todo>;
  order: string[];
  filter: "all" | "active" | "done";
}

interface Todo {
  id: string;
  title: string;
  done: boolean;
}
```

### 핸들러/커맨드 등록

```typescript
// 순수 상태 변환
defineHandler("todo/add", (db, title: string) => {
  const id = crypto.randomUUID();
  return {
    ...db,
    app: {
      ...db.app,
      todo: {
        ...db.app.todo,
        items: { ...db.app.todo.items, [id]: { id, title, done: false } },
        order: [...db.app.todo.order, id],
      },
    },
  };
});

defineHandler("todo/toggle-done", (db, id: string) => {
  const todo = db.app.todo.items[id];
  return {
    ...db,
    app: {
      ...db.app,
      todo: {
        ...db.app.todo,
        items: { ...db.app.todo.items, [id]: { ...todo, done: !todo.done } },
      },
    },
  };
});

defineHandler("todo/set-filter", (db, filter: "all" | "active" | "done") => ({
  ...db,
  app: { ...db.app, todo: { ...db.app.todo, filter } },
}));

// 이펙트가 필요한 커맨드
defineCommand("todo/delete", (ctx, id: string) => ({
  db: removeTodo(ctx.db, id),
  toast: `"${ctx.db.app.todo.items[id].title}" deleted`,
}));

defineCommand("todo/export", (ctx) => ({
  clipboard: JSON.stringify(Object.values(ctx.db.app.todo.items)),
  toast: "Copied to clipboard",
}));
```

### 쿼리 등록

```typescript
defineQuery("todo/list", (db) => db.app.todo.order.map((id) => db.app.todo.items[id]));

defineQuery(
  "todo/filtered-list",
  () => [["todo/list"]],
  ([todos]) => {
    const filter = store.getState().db.app.todo.filter;
    if (filter === "all") return todos;
    return todos.filter((t) => (filter === "done" ? t.done : !t.done));
  }
);

defineQuery("todo/count", (db) => ({
  total: db.app.todo.order.length,
  done: Object.values(db.app.todo.items).filter((t) => t.done).length,
}));
```

### 컴포넌트

```tsx
function TodoApp() {
  const todos = useQuery(["todo/filtered-list"]);
  const count = useQuery(["todo/count"]);
  const send = useDispatch();

  return (
    <div>
      <h1>Todos ({count.done}/{count.total})</h1>

      <input
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.currentTarget.value) {
            send({ type: "todo/add", payload: e.currentTarget.value });
            e.currentTarget.value = "";
          }
        }}
      />

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <button
              type="button"
              onClick={() => send({ type: "todo/toggle-done", payload: todo.id })}
            >
              {todo.done ? "[x]" : "[ ]"} {todo.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 9. 테스트

### 핸들러 테스트 — 순수함수, DOM 불필요

```typescript
import { test, expect } from "vitest";

test("todo/toggle-done flips done state", () => {
  const db = {
    app: {
      todo: {
        items: { "1": { id: "1", title: "Buy milk", done: false } },
        order: ["1"],
      },
    },
  };

  const next = handlers.get("todo/toggle-done")!(db, "1");

  expect(next.app.todo.items["1"].done).toBe(true);
});
```

### 커맨드 테스트 — cofx 주입, DOM 불필요

```typescript
test("navigate down moves to next item", () => {
  const ctx = {
    db: {
      focus: {
        activeZoneId: "list",
        zones: {
          list: { focusedItemId: "item-1", selection: [], expandedItems: [] },
        },
      },
    },
    "dom-items": ["item-1", "item-2", "item-3"],
    "zone-config": { navigate: { orientation: "vertical", loop: false } },
  };

  const fx = commands.get("navigate")!(ctx, { direction: "down" });

  expect(fx.db.focus.zones.list.focusedItemId).toBe("item-2");
  expect(fx.focus).toBe("item-2");
  expect(fx.scroll).toBe("item-2");
});

test("navigate at end with loop wraps to first", () => {
  const ctx = {
    db: {
      focus: {
        activeZoneId: "list",
        zones: {
          list: { focusedItemId: "item-3", selection: [], expandedItems: [] },
        },
      },
    },
    "dom-items": ["item-1", "item-2", "item-3"],
    "zone-config": { navigate: { orientation: "vertical", loop: true } },
  };

  const fx = commands.get("navigate")!(ctx, { direction: "down" });

  expect(fx.db.focus.zones.list.focusedItemId).toBe("item-1");
});
```

### 이펙트 테스트 — 개별 실행기 모킹

```typescript
test("focus effect calls element.focus()", () => {
  const mockEl = { focus: vi.fn() };
  vi.spyOn(document, "getElementById").mockReturnValue(mockEl as any);

  effects.get("focus")!("item-2");

  expect(mockEl.focus).toHaveBeenCalledWith({ preventScroll: true });
});
```

---

## 10. 실행 흐름 요약

```
dispatch({ type: "navigate", payload: { direction: "down" } })
  │
  ├─ [Middleware: before] transaction — 스냅샷 캡처
  ├─ [Middleware: before] inject("dom-items") — DOM에서 아이템 목록 수집
  ├─ [Middleware: before] inject("zone-config") — zone 설정 조회
  │
  ├─ handler(ctx, payload) → EffectMap   ← 순수함수
  │   {
  │     db: { focus: { zones: { list: { focusedItemId: "item-2" } } } },
  │     focus: "item-2",
  │     scroll: "item-2",
  │   }
  │
  ├─ [Middleware: after] sticky-coord — 좌표 기록
  ├─ [Middleware: after] transaction — diff 계산, 로그 기록
  │
  ├─ [Effect: db]     → store.setState(nextDb)
  ├─ [Effect: focus]  → document.getElementById("item-2").focus()
  └─ [Effect: scroll] → document.getElementById("item-2").scrollIntoView()
```
