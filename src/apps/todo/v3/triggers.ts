/**
 * Todo v3 Triggers — createTrigger usage examples.
 *
 * Simple triggers: headless button wrappers (OS.Trigger hidden)
 * Compound trigger: Dialog with Trigger/Portal/Content/Dismiss/Confirm
 *
 * These replace direct OS.Trigger usage in widget UI components,
 * completing the "React knows nothing about OS" promise.
 */

import { TodoApp, TodoList, TodoToolbar } from "@apps/todo/v3/app";

// ═══════════════════════════════════════════════════════════════════
// Simple Triggers — headless button components
// ═══════════════════════════════════════════════════════════════════

/** Delete a todo item. Usage: <DeleteButton payload={{ id }}><button>삭제</button></DeleteButton> */
export const DeleteButton = TodoApp.createTrigger(TodoList.commands.deleteTodo);

/** Duplicate a todo item. */
export const DuplicateButton = TodoApp.createTrigger(
  TodoList.commands.duplicateTodo,
);

/** Toggle a todo item's completion. */
export const ToggleButton = TodoApp.createTrigger(TodoList.commands.toggleTodo);

/** Start editing a todo item. */
export const EditButton = TodoApp.createTrigger(TodoList.commands.startEdit);

// ═══════════════════════════════════════════════════════════════════
// Compound Trigger — Clear Completed confirmation dialog
// ═══════════════════════════════════════════════════════════════════

/**
 * ClearDialog — confirmation modal for clearing completed tasks.
 *
 * Usage:
 *   <ClearDialog.Root>
 *     <ClearDialog.Trigger><button>Clear</button></ClearDialog.Trigger>
 *     <ClearDialog.Content title="Clear completed?">
 *       <p>This action cannot be undone.</p>
 *       <ClearDialog.Dismiss><button>Cancel</button></ClearDialog.Dismiss>
 *       <ClearDialog.Confirm><button>Clear</button></ClearDialog.Confirm>
 *     </ClearDialog.Content>
 *   </ClearDialog.Root>
 */
export const ClearDialog = TodoApp.createTrigger({
  id: "todo-clear-dialog",
  confirm: TodoToolbar.commands.clearCompleted,
});
