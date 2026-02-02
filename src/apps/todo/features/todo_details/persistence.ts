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
  },
  effects: [],
  history: {
    past: [],
    future: [],
  },
};

const STORAGE_KEY = "interactive-os-todo-v3";

export const loadState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Quick migration check
      if (Array.isArray(parsed.todos)) {
        return INITIAL_STATE;
      }

      if (parsed.categories && parsed.todos) {
        return {
          ...INITIAL_STATE,
          data: {
            ...INITIAL_STATE.data,
            categories: parsed.categories,
            todos: parsed.todos,
            categoryOrder:
              parsed.categoryOrder || Object.keys(parsed.categories),
            todoOrder:
              parsed.todoOrder || Object.keys(parsed.todos).map(Number),
          },
        };
      }
    }
  } catch (e) {
    console.warn("Failed to load state", e);
  }
  return INITIAL_STATE;
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  } catch (e) {
    console.warn("Failed to save state", e);
  }
};
