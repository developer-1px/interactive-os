import type { AppState } from "@apps/todo/model/types";

export const INITIAL_STATE: AppState = {
  data: {
    categories: {
      cat_inbox: { id: "cat_inbox", text: "Inbox" },
      cat_work: { id: "cat_work", text: "Work" },
      cat_personal: { id: "cat_personal", text: "Personal" },
    },
    categoryOrder: ["cat_inbox", "cat_work", "cat_personal"],
    todos: {
      todo_1: {
        id: "todo_1",
        text: "Complete Interaction OS docs",
        completed: false,
        categoryId: "cat_inbox",
      },
      todo_2: {
        id: "todo_2",
        text: "Review Red Team feedback",
        completed: true,
        categoryId: "cat_work",
      },
      todo_3: {
        id: "todo_3",
        text: "Plan next iteration",
        completed: false,
        categoryId: "cat_work",
      },
      todo_4: {
        id: "todo_4",
        text: "Buy groceries",
        completed: false,
        categoryId: "cat_personal",
      },
    },
    todoOrder: ["todo_1", "todo_2", "todo_3", "todo_4"],
  },
  ui: {
    selectedCategoryId: "cat_inbox",
    draft: "",
    editingId: null,
    editDraft: "",
    viewMode: "list",
    isInspectorOpen: true,
    clipboard: null,
  },
  effects: [],
  history: {
    past: [],
    future: [],
  },
};
