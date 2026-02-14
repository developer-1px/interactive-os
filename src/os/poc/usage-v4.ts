/**
 * defineApp v4 Usage — Type Inference PoC
 *
 * This file exercises every tier and verifies that TypeScript
 * correctly infers types WITHOUT manual annotations.
 *
 * Run: npx tsc --noEmit src/os/poc/usage-v4.ts
 */

import { defineApp } from "./defineApp-v4";

// ═══════════════════════════════════════════════════════════════════
// App State — same structure as Todo v3
// ═══════════════════════════════════════════════════════════════════

interface TodoState {
    data: {
        todos: Record<number, { id: number; text: string; completed: boolean }>;
        todoOrder: number[];
    };
    ui: {
        selectedCategoryId: string;
        draft: string;
        editingId: number | null;
    };
}

const INITIAL: TodoState = {
    data: { todos: {}, todoOrder: [] },
    ui: { selectedCategoryId: "all", draft: "", editingId: null },
};

// ═══════════════════════════════════════════════════════════════════
// Tier 1: defineApp
// ═══════════════════════════════════════════════════════════════════

const TodoApp = defineApp<TodoState>("todo", INITIAL, {
    selectors: {
        visibleTodos: (state) => Object.values(state.data.todos),
    },
});

// ═══════════════════════════════════════════════════════════════════
// Tier 2: createZone
// ═══════════════════════════════════════════════════════════════════

const todoList = TodoApp.createZone("list");

// ═══════════════════════════════════════════════════════════════════
// Tier 3: command — TYPE INFERENCE TESTS
// ═══════════════════════════════════════════════════════════════════

// Q1: Does ctx.state infer as TodoState?
const toggleTodo = todoList.command(
    "TOGGLE_TODO",
    (ctx, payload: { id: number }) => {
        // ✅ VERIFY: ctx.state should be TodoState
        const _todos = ctx.state.data.todos;       // should be Record<number, ...>
        const _order = ctx.state.data.todoOrder;   // should be number[]
        const _draft = ctx.state.ui.draft;         // should be string

        // ✅ VERIFY: payload should be { id: number }
        const _id: number = payload.id;

        return {
            state: {
                ...ctx.state,
                data: {
                    ...ctx.state.data,
                    todos: {
                        ...ctx.state.data.todos,
                        [payload.id]: {
                            ...ctx.state.data.todos[payload.id]!,
                            completed: !ctx.state.data.todos[payload.id]?.completed,
                        },
                    },
                },
            },
        };
    },
);

// Q2: Does toggleTodo get typed as CommandFactory<"TOGGLE_TODO", { id: number }>?
type ToggleType = typeof toggleTodo;
//   ^? Should be CommandFactory<"TOGGLE_TODO", { id: number }>

// ✅ VERIFY: commandType should be "TOGGLE_TODO" literal
const _type: "TOGGLE_TODO" = toggleTodo.commandType;

// ✅ VERIFY: calling factory requires { id: number }
const _cmd = toggleTodo({ id: 1 });
//    ^? Should be Command<"TOGGLE_TODO", { id: number }>

// @ts-expect-error — missing required payload
const _bad1 = toggleTodo();

// @ts-expect-error — wrong payload type
const _bad2 = toggleTodo({ id: "string" });


// ── Another command: no payload (void) ──

const clearCompleted = todoList.command(
    "CLEAR_COMPLETED",
    (ctx) => {
        const remaining: Record<number, any> = {};
        for (const [id, todo] of Object.entries(ctx.state.data.todos)) {
            if (!todo.completed) remaining[Number(id)] = todo;
        }
        return {
            state: {
                ...ctx.state,
                data: {
                    ...ctx.state.data,
                    todos: remaining,
                    todoOrder: ctx.state.data.todoOrder.filter((id) => remaining[id]),
                },
            },
        };
    },
);

// ✅ VERIFY: void command — no arguments needed
const _clearCmd = clearCompleted();

// ✅ VERIFY: commandType is literal
const _clearType: "CLEAR_COMPLETED" = clearCompleted.commandType;


// ── Command with dispatch side-effect ──

const deleteTodo = todoList.command(
    "DELETE_TODO",
    (ctx, payload: { id: number }) => {
        const { [payload.id]: _, ...remaining } = ctx.state.data.todos;
        return {
            state: {
                ...ctx.state,
                data: {
                    ...ctx.state.data,
                    todos: remaining,
                    todoOrder: ctx.state.data.todoOrder.filter((id) => id !== payload.id),
                },
            },
            // dispatch side effect preserved
            dispatch: clearCompleted(),
        };
    },
);

// ═══════════════════════════════════════════════════════════════════
// Tier 4: bind — Zone event wiring
// ═══════════════════════════════════════════════════════════════════

const TodoListUI = todoList.bind({
    role: "listbox",
    onCheck: toggleTodo,
    onDelete: deleteTodo,
});

// ✅ VERIFY: bound components exist
const _Zone = TodoListUI.Zone;
const _Item = TodoListUI.Item;
const _Field = TodoListUI.Field;


// ═══════════════════════════════════════════════════════════════════
// Test instance — Redux-style dispatch
// ═══════════════════════════════════════════════════════════════════

const app = TodoApp.create();

// ✅ VERIFY: dispatch takes a command object (Redux pattern)
app.dispatch(toggleTodo({ id: 42 }));
app.dispatch(clearCompleted());
app.dispatch(deleteTodo({ id: 1 }));

// ✅ VERIFY: state is TodoState
const _state: TodoState = app.state;
const _todoCount = Object.keys(app.state.data.todos).length;


// ═══════════════════════════════════════════════════════════════════
// Comparison: v3 vs v4 boilerplate
// ═══════════════════════════════════════════════════════════════════

/*
 * v3 (current — per command):
 *   const toggleTodo = define.command(
 *     "toggleTodo",
 *     [],                                          // deps (usually empty)
 *     (ctx: { state: AppState }) =>                 // ← typed manually every time
 *       (payload: { id: number | string }) => ({    // ← curried
 *         state: produce(ctx.state, (draft) => { ... }),
 *       }),
 *   );
 *
 *   return {
 *     commands: { toggleTodo, deleteTodo, ... },    // ← 2nd declaration
 *     zone: { onCheck: toggleTodo, ... },           // ← 3rd reference
 *   };
 *
 * v4 (proposed — per command):
 *   const toggleTodo = todoList.command(
 *     "TOGGLE_TODO",
 *     (ctx, payload: { id: number }) => ({          // ← ctx inferred, flat
 *       state: produce(ctx.state, (draft) => { ... }),
 *     }),
 *   );
 *
 *   todoList.bind({ onCheck: toggleTodo, ... });    // ← 1 reference only
 *
 * Removed:
 *   ❌ (ctx: { state: AppState }) manual annotation
 *   ❌ [] deps array (usually empty)
 *   ❌ curried (ctx) => (payload) => form
 *   ❌ commands: { ... } return object
 */

// ═══════════════════════════════════════════════════════════════════
// Summary: Type Inference Checklist
// ═══════════════════════════════════════════════════════════════════

/*
 * Q1. ctx.state infers as TodoState?           → Check tsc output
 * Q2. commandType infers as string literal?    → _type assignment verifies
 * Q3. payload type enforced?                   → @ts-expect-error verifies
 * Q4. void command needs no args?              → clearCompleted() verifies
 * Q5. dispatch accepts Command objects?        → app.dispatch() verifies
 * Q6. { state, dispatch? } return preserved?   → deleteTodo handler verifies
 */
