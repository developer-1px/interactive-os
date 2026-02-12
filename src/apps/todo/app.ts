import { INITIAL_STATE } from "@apps/todo/features/todo_details/persistence";
import type { AppState } from "@apps/todo/model/types";
import { registerAppSlice } from "@/os/appSlice";

/**
 * todoSlice — Kernel-native Todo app state registration.
 *
 * Replaces legacy `defineApplication` + `createEngine`.
 * All commands are defined via `todoSlice.group.defineCommand`.
 */
export const todoSlice = registerAppSlice<AppState>("todo", {
  initialState: INITIAL_STATE,
  // persistence: {
  //   key: "todo-app-v5",
  //   debounceMs: 250,
  // },
  history: true,
});

// Dev/Test: Expose for Playwright E2E
if (import.meta.env.DEV) {
  (window as any).__todoSlice = todoSlice;
}
