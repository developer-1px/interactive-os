/**
 * defineApp v4 — Usage-Only PoC
 *
 * ❗ 구현 없음. 타입 스텁 + usage 코드만.
 * 목적: 4-tier API의 실제 DX(개발자 경험)를 눈으로 확인.
 *
 * 커버하는 시나리오:
 *   A. Todo — Entity CRUD, 복수 Zone, Zone 이벤트 풀바인딩, keybindings
 *   B. Builder — Flat KV, 단일 Zone, Field 바인딩, setState escape
 *   C. 테스트 — Redux-style dispatch
 *   D. React 렌더링 — useComputed
 */

import { defineApp } from "./defineApp-v4";
import { produce } from "immer";

// ═══════════════════════════════════════════════════════════════════
//  A. Todo App — Entity CRUD + 복수 Zone
// ═══════════════════════════════════════════════════════════════════

interface TodoState {
    data: {
        todos: Record<number, { id: number; text: string; completed: boolean; categoryId: string }>;
        todoOrder: number[];
        categories: Record<string, { id: string; name: string }>;
        categoryOrder: string[];
    };
    ui: {
        selectedCategoryId: string;
        draft: string;
        editingId: number | null;
        editDraft: string;
        viewMode: "list" | "board";
        clipboard: { todo: any; isCut: boolean } | null;
    };
}

const TODO_INITIAL: TodoState = {
    data: { todos: {}, todoOrder: [], categories: {}, categoryOrder: [] },
    ui: {
        selectedCategoryId: "all",
        draft: "",
        editingId: null,
        editDraft: "",
        viewMode: "list",
        clipboard: null,
    },
};

// ── Tier 1: App ──────────────────────────────────────────────────

const TodoApp = defineApp<TodoState>("todo-v3", TODO_INITIAL, {
    history: true,
    selectors: {
        visibleTodos: (state) =>
            state.data.todoOrder
                .map((id) => state.data.todos[id]!)
                .filter((t) => t.categoryId === state.ui.selectedCategoryId),
        categories: (state) =>
            state.data.categoryOrder.map((id) => state.data.categories[id]!),
        stats: (state) => {
            const all = Object.values(state.data.todos);
            return { total: all.length, completed: all.filter((t) => t.completed).length };
        },
    },
});


// ── Tier 2: Zones ────────────────────────────────────────────────

const listZone = TodoApp.createZone("list");
const sidebarZone = TodoApp.createZone("sidebar");
const draftZone = TodoApp.createZone("draft");
const editZone = TodoApp.createZone("edit");
const toolbarZone = TodoApp.createZone("toolbar");


// ── Tier 3: Commands ─────────────────────────────────────────────

// listZone commands
const toggleTodo = listZone.command(
    "TOGGLE_TODO",
    (ctx, payload: { id: number }) =>
        ({ state: produce(ctx.state, (d) => { d.data.todos[payload.id]!.completed = !d.data.todos[payload.id]!.completed; }) }),
);

const deleteTodo = listZone.command(
    "DELETE_TODO",
    (ctx, payload: { id: number }) =>
        ({ state: produce(ctx.state, (d) => { delete d.data.todos[payload.id]; d.data.todoOrder = d.data.todoOrder.filter((i) => i !== payload.id); }) }),
);

const startEdit = listZone.command(
    "START_EDIT",
    (ctx, payload: { id: number }) =>
        ({ state: produce(ctx.state, (d) => { d.ui.editingId = payload.id; d.ui.editDraft = d.data.todos[payload.id]?.text || ""; }) }),
);

const moveItemUp = listZone.command(
    "MOVE_ITEM_UP",
    (ctx, payload: { focusId: number }) =>
        ({ state: produce(ctx.state, (d) => { /* reorder logic */ void payload.focusId; }) }),
);

const moveItemDown = listZone.command(
    "MOVE_ITEM_DOWN",
    (ctx, payload: { focusId: number }) =>
        ({ state: produce(ctx.state, (d) => { void payload.focusId; }) }),
);

const duplicateTodo = listZone.command(
    "DUPLICATE_TODO",
    (ctx, payload: { id: number }) =>
        ({ state: produce(ctx.state, (d) => { void payload.id; }) }),
);

const copyTodo = listZone.command(
    "COPY_TODO",
    (ctx, payload: { id: number }) =>
        ({ state: produce(ctx.state, (d) => { void payload.id; }) }),
);

const cutTodo = listZone.command(
    "CUT_TODO",
    (ctx, payload: { id: number }) =>
        ({ state: produce(ctx.state, (d) => { void payload.id; }) }),
);

const pasteTodo = listZone.command(
    "PASTE_TODO",
    (ctx, payload: { id?: number }) =>
        ({ state: produce(ctx.state, (d) => { void payload.id; }) }),
);

const undoCommand = listZone.command(
    "UNDO",
    (ctx) => ({ state: ctx.state }),
);

const redoCommand = listZone.command(
    "REDO",
    (ctx) => ({ state: ctx.state }),
);


// sidebarZone commands
const selectCategory = sidebarZone.command(
    "SELECT_CATEGORY",
    (ctx, payload: { id: string }) =>
        ({ state: { ...ctx.state, ui: { ...ctx.state.ui, selectedCategoryId: payload.id } } }),
);


// draftZone commands
const syncDraft = draftZone.command(
    "SYNC_DRAFT",
    (ctx, payload: { text: string }) =>
        ({ state: { ...ctx.state, ui: { ...ctx.state.ui, draft: payload.text } } }),
);

const addTodo = draftZone.command(
    "ADD_TODO",
    (ctx, payload: { text?: string }) =>
        ({ state: produce(ctx.state, (d) => { void payload.text; }) }),
);


// editZone commands
const syncEditDraft = editZone.command(
    "SYNC_EDIT_DRAFT",
    (ctx, payload: { text: string }) =>
        ({ state: { ...ctx.state, ui: { ...ctx.state.ui, editDraft: payload.text } } }),
);

const updateTodoText = editZone.command(
    "UPDATE_TODO_TEXT",
    (ctx, payload: { text: string }) =>
        ({ state: produce(ctx.state, (d) => { void payload.text; }) }),
);

const cancelEdit = editZone.command(
    "CANCEL_EDIT",
    (ctx) =>
        ({ state: produce(ctx.state, (d) => { d.ui.editingId = null; d.ui.editDraft = ""; }) }),
);


// toolbarZone commands
const toggleView = toolbarZone.command(
    "TOGGLE_VIEW",
    (ctx) =>
        ({ state: { ...ctx.state, ui: { ...ctx.state.ui, viewMode: ctx.state.ui.viewMode === "board" ? "list" : "board" } } }),
);

const clearCompleted = toolbarZone.command(
    "CLEAR_COMPLETED",
    (ctx) =>
        ({ state: produce(ctx.state, (d) => { /* remove completed */ }) }),
);


// ── Tier 4: Bind ─────────────────────────────────────────────────

const TodoListUI = listZone.bind({
    role: "listbox",
    onCheck: toggleTodo,
    onAction: startEdit,
    onDelete: deleteTodo,
    onCopy: copyTodo,
    onCut: cutTodo,
    onPaste: pasteTodo,
    onMoveUp: moveItemUp,
    onMoveDown: moveItemDown,
    onUndo: undoCommand,
    onRedo: redoCommand,
});

const TodoSidebarUI = sidebarZone.bind({
    role: "listbox",
    onAction: selectCategory,
});

const TodoDraftUI = draftZone.bind({
    role: "textbox",
    field: {
        onChange: syncDraft,
        onSubmit: addTodo,
    },
});

const TodoEditUI = editZone.bind({
    role: "textbox",
    field: {
        onChange: syncEditDraft,
        onSubmit: updateTodoText,
        onCancel: cancelEdit,
    },
});

// toolbar — keybindings만, zone 이벤트 없음
const _TodoToolbarUI = toolbarZone.bind({
    role: "toolbar",
});


// ═══════════════════════════════════════════════════════════════════
//  B. Builder App — Flat KV + 단일 Zone
// ═══════════════════════════════════════════════════════════════════

interface BuilderState {
    data: { fields: Record<string, string> };
    ui: { selectedId: string | null; selectedType: string | null };
}

const BUILDER_INITIAL: BuilderState = {
    data: { fields: { "hero-title": "Hello World" } },
    ui: { selectedId: null, selectedType: null },
};

const BuilderApp = defineApp<BuilderState>("builder", BUILDER_INITIAL, {
    selectors: {
        fieldValue: (state, name: string) => state.data.fields[name] ?? "",
        selectedId: (state) => state.ui.selectedId,
    },
});

const canvasZone = BuilderApp.createZone("canvas");

const updateField = canvasZone.command(
    "UPDATE_FIELD",
    (ctx, payload: { name: string; value: string }) =>
        ({ state: produce(ctx.state, (d) => { d.data.fields[payload.name] = payload.value; }) }),
);

const selectElement = canvasZone.command(
    "SELECT_ELEMENT",
    (ctx, payload: { id: string | null; type: string | null }) =>
        ({ state: produce(ctx.state, (d) => { d.ui.selectedId = payload.id; d.ui.selectedType = payload.type; }) }),
);

const BuilderCanvasUI = canvasZone.bind({
    role: "grid",
});

// Builder의 onCommit escape hatch — setState 직접 호출
function builderUpdateField(name: string, value: string) {
    BuilderApp.setState((prev) =>
        produce(prev, (d) => { d.data.fields[name] = value; }),
    );
}


// ═══════════════════════════════════════════════════════════════════
//  C. 테스트 — Redux-style dispatch
// ═══════════════════════════════════════════════════════════════════

// v3 (현재):
//   const app = TodoApp.create();
//   app.dispatch.toggleTodo({ id: 1 });      ← 네임스페이스

// v4 (제안):
//   const app = TodoApp.create();
//   app.dispatch(toggleTodo({ id: 1 }));     ← Redux 패턴

const todoTestApp = TodoApp.create();
todoTestApp.dispatch(toggleTodo({ id: 1 }));
todoTestApp.dispatch(addTodo({ text: "New" }));
todoTestApp.dispatch(clearCompleted());
todoTestApp.dispatch(selectCategory({ id: "work" }));

// state 접근
const _t: TodoState = todoTestApp.state;
const _todos = todoTestApp.state.data.todos;

// reset
todoTestApp.reset();

// overrides
const todoTestApp2 = TodoApp.create({
    ui: { ...TODO_INITIAL.ui, viewMode: "board" },
});

// Builder 테스트
const builderTestApp = BuilderApp.create();
builderTestApp.dispatch(updateField({ name: "hero-title", value: "Changed" }));
builderTestApp.dispatch(selectElement({ id: "hero", type: "section" }));


// ═══════════════════════════════════════════════════════════════════
//  D. React 렌더링 — useComputed
// ═══════════════════════════════════════════════════════════════════

// function TodoListComponent() {
//   const visibleTodos = TodoApp.useComputed((s) => s.data.todoOrder.map((id) => s.data.todos[id]!));
//   const draft = TodoApp.useComputed((s) => s.ui.draft);
//
//   return (
//     <>
//       <TodoDraftUI.Field name="draft" value={draft} placeholder="Add todo..." />
//
//       <TodoListUI.Zone>
//         {visibleTodos.map((todo) => (
//           <TodoListUI.Item key={todo.id} id={String(todo.id)}>
//             <span>{todo.text}</span>
//           </TodoListUI.Item>
//         ))}
//       </TodoListUI.Zone>
//
//       <TodoSidebarUI.Zone>
//         {categories.map((cat) => (
//           <TodoSidebarUI.Item key={cat.id} id={cat.id}>
//             {cat.name}
//           </TodoSidebarUI.Item>
//         ))}
//       </TodoSidebarUI.Zone>
//     </>
//   );
// }


// ═══════════════════════════════════════════════════════════════════
//  E. v3 vs v4 비교 — 같은 앱, 다른 코드
// ═══════════════════════════════════════════════════════════════════

/*
┌─────────────────────┬──────────────────────────────────────────────┬──────────────────────────────────────────────┐
│                     │ v3 (현재 543줄)                              │ v4 (제안 ~200줄)                             │
├─────────────────────┼──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ App 정의            │ defineApp<S>(id, state, opts)                │ defineApp<S>(id, state, opts)               │
│                     │                                              │ (동일)                                       │
├─────────────────────┼──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ Widget/Zone 생성    │ App.createWidget("list", (define) => {       │ App.createZone("list")                      │
│                     │   // 콜백 안에서 모든 것을 정의               │ // 모듈 레벨에서 분리 정의                    │
│                     │ })                                           │                                              │
├─────────────────────┼──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 커맨드 정의         │ define.command("toggle", [],                 │ zone.command("TOGGLE",                      │
│                     │   (ctx: { state: S }) =>                     │   (ctx, payload: { id: number }) =>          │
│                     │     (payload: { id: number }) => ({          │     ({ state: produce(...) })                 │
│                     │       state: produce(...)                    │ )                                            │
│                     │     })                                       │                                              │
│                     │ )                                            │                                              │
├─────────────────────┼──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 제거된 boilerplate  │                                              │ ❌ ctx: { state: S } 수동 타이핑             │
│                     │                                              │ ❌ [] deps 배열                              │
│                     │                                              │ ❌ curried (ctx) => (payload) => 형태        │
│                     │                                              │ ❌ commands: { ... } 반환 객체               │
│                     │                                              │ ❌ 콜백 래퍼 (define) => { ... }             │
├─────────────────────┼──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 바인딩              │ return {                                     │ zone.bind({                                  │
│                     │   commands: { toggle, delete },              │   role: "listbox",                           │
│                     │   zone: { role: "listbox",                   │   onCheck: toggle,                           │
│                     │     onCheck: toggle,                         │ })                                           │
│                     │     onDelete: delete,                        │                                              │
│                     │   },                                         │                                              │
│                     │ }                                            │                                              │
├─────────────────────┼──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 테스트              │ app.dispatch.toggleTodo({ id: 1 })           │ app.dispatch(toggleTodo({ id: 1 }))          │
│                     │ (네임스페이스)                                │ (Redux 패턴)                                 │
├─────────────────────┼──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 커맨드 네이밍       │ "toggleTodo" (camelCase)                     │ "TOGGLE_TODO" (UPPER_SNAKE_CASE)             │
│                     │ 컨벤션 위반                                  │ 컨벤션 준수 ✅                                │
└─────────────────────┴──────────────────────────────────────────────┴──────────────────────────────────────────────┘
*/


// ═══════════════════════════════════════════════════════════════════
// Suppress unused variable warnings
// ═══════════════════════════════════════════════════════════════════
void TodoListUI;
void TodoSidebarUI;
void TodoDraftUI;
void TodoEditUI;
void BuilderCanvasUI;
void builderUpdateField;
void _t;
void _todos;
void todoTestApp2;
void builderTestApp;
