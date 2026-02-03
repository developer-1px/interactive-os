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

const STORAGE_KEY = "interactive-os-todo-v3";



// const INSPECTOR_KEY = "antigravity_inspector_open";

export const loadState = (): AppState => {
  let loadedState = INITIAL_STATE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Quick migration check
      if (!Array.isArray(parsed.todos) && parsed.categories && parsed.todos) {
        loadedState = {
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

  // Load Inspector State (Separate Persistence)
  // DISABLED: Force Inspector Open by default for development
  /*
  try {
    const inspectorStored = localStorage.getItem(INSPECTOR_KEY);
    // User requested: "First start is open" -> Logic: If null, use true (INITIAL_STATE has true).
    // If stored "false", use false. if stored "true", use true.
    if (inspectorStored !== null) {
      loadedState = {
        ...loadedState,
        ui: {
          ...loadedState.ui,
          isInspectorOpen: JSON.parse(inspectorStored),
        },
      };
    }
  } catch (e) {
    console.warn("Failed to load inspector state", e);
  }
  */

  return loadedState;
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  } catch (e) {
    console.warn("Failed to save state", e);
  }
};
