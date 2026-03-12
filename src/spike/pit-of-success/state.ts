/**
 * Spike state — mutable store for pit-of-success tests.
 * Real app uses defineApp + kernel.
 */

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const DEFAULT_TODOS: Record<string, Todo> = {
  "todo-1": { id: "todo-1", text: "Buy milk", completed: false },
  "todo-2": { id: "todo-2", text: "Write tests", completed: true },
  "todo-3": { id: "todo-3", text: "Review PR", completed: false },
};

let todos: Record<string, Todo> = { ...DEFAULT_TODOS };
let todoOrder: string[] = Object.keys(DEFAULT_TODOS);

export function getTodos() {
  return todos;
}

export function getTodoOrder() {
  return todoOrder;
}

export function resetState(
  newTodos?: Record<string, Todo>,
  newOrder?: string[],
) {
  todos = newTodos ?? { ...DEFAULT_TODOS };
  todoOrder = newOrder ?? Object.keys(todos);
}

export function toggleTodo(id: string) {
  const todo = todos[id];
  if (todo) {
    todos = { ...todos, [id]: { ...todo, completed: !todo.completed } };
  }
}

export function deleteTodo(id: string) {
  const { [id]: _, ...rest } = todos;
  todos = rest;
  todoOrder = todoOrder.filter((i) => i !== id);
}

let nextId = 4;
export function addTodo(text: string) {
  if (!text.trim()) return;
  const id = `todo-${nextId++}`;
  todos = { ...todos, [id]: { id, text: text.trim(), completed: false } };
  todoOrder = [...todoOrder, id];
}
