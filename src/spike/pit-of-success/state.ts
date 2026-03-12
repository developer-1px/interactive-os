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
