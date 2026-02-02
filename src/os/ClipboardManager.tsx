import { useEffect } from "react";
import { useTodoStore } from "../lib/todoEngine";
import { useFocusStore } from "../stores/useFocusStore";

/**
 * ClipboardManager
 *
 * Headless component that acts as the "OS Bridge" for Clipboard operations.
 * Use pure native events (copy/paste) to interact with system clipboard.
 *
 * Future: Move to src/os/ if we formalize that directory.
 */
export function ClipboardManager() {
  // We access the store directly to get state for Copy
  const store = useTodoStore();

  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      // Only handle copy if we are in a zone that supports it?
      // Or just check if there is a selection.

      // Check if user is in an input field (native behavior should prevail)
      if (isInputActive()) return;

      const state = useTodoStore.getState().state;
      // Get Focus from OS Store
      const focusId = useFocusStore.getState().focusedItemId;
      const { todos, categories } = state.data;

      // 1. Copying a Todo Item
      if (typeof focusId !== "object" && !isNaN(Number(focusId))) { // Check if numeric ID (Todo)
        const todoId = Number(focusId);
        const todo = todos[todoId];
        if (todo) {
          e.preventDefault();
          const text = todo.text;
          const json = JSON.stringify(todo, null, 2);

          e.clipboardData?.setData("text/plain", text);
          e.clipboardData?.setData("application/json", json);
          // console.log('Copied Todo:', text);
        }
      }
      // 2. Copying a Category
      else if (typeof focusId === "string" && focusId.startsWith("cat_")) {
        const category = categories[focusId];
        if (category) {
          e.preventDefault();
          e.clipboardData?.setData("text/plain", category.text);
          e.clipboardData?.setData(
            "application/json",
            JSON.stringify(category, null, 2),
          );
        }
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (isInputActive()) return;

      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain");
      const json = e.clipboardData?.getData("application/json");

      // Try parsing JSON
      let items: any[] = [];
      if (json) {
        try {
          const parsed = JSON.parse(json);
          items = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          // Ignore
        }
      }

      // Fallback to text (split by newlines)
      if (items.length === 0 && text) {
        items = text.split("\n").filter((line) => line.trim().length > 0);
      }

      if (items.length > 0) {
        store.dispatch({ type: "IMPORT_TODOS", payload: { items } });
      }
    };

    window.addEventListener("copy", handleCopy);
    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  return null;
}

function isInputActive() {
  const el = document.activeElement;
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    (el as HTMLElement)?.isContentEditable
  );
}
