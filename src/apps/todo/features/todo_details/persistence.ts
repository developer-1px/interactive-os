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
      1: {
        id: 1,
        text: "Complete Interaction OS docs",
        completed: false,
        categoryId: "cat_inbox",
      },
      2: {
        id: 2,
        text: "Review Red Team feedback",
        completed: true,
        categoryId: "cat_work",
      },
      3: {
        id: 3,
        text: "Plan next iteration",
        completed: false,
        categoryId: "cat_work",
      },
      4: {
        id: 4,
        text: "Buy groceries",
        completed: false,
        categoryId: "cat_personal",
      },
    },
    todoOrder: [1, 2, 3, 4],
  },
  ui: {
    selectedCategoryId: "cat_inbox",
    draft: "",
    editingId: null,
    editDraft: "",
    viewMode: "list",
    isInspectorOpen: true,
  },
  effects: [],
  history: {
    past: [],
    future: [],
  },
};


