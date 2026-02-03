import { ToggleView } from "./board";
import {
    MoveCategoryUp,
    MoveCategoryDown,
    SelectCategory,
    JumpToList,
} from "./categories";
import {
    AddTodo,
    ImportTodos,
    ToggleTodo,
    DeleteTodo,
    MoveItemUp,
    MoveItemDown,
    StartEdit,
    SyncDraft,
    SyncEditDraft,
    CancelEdit,
    UpdateTodoText,
} from "./list";

// Re-export constants
export * from "./board";
export * from "./categories";
export * from "./list";

// Union Type (Actions)
// We extract the ReturnType of each factory to get the Action shape { type: K, payload: P }
export type InferredTodoCommand =
    | ReturnType<typeof ToggleView>
    | ReturnType<typeof MoveCategoryUp>
    | ReturnType<typeof MoveCategoryDown>
    | ReturnType<typeof SelectCategory>
    | ReturnType<typeof JumpToList>
    | ReturnType<typeof AddTodo>
    | ReturnType<typeof ImportTodos>
    | ReturnType<typeof ToggleTodo>
    | ReturnType<typeof DeleteTodo>
    | typeof MoveItemUp extends (...args: any) => any ? ReturnType<typeof MoveItemUp> : never
    | typeof MoveItemDown extends (...args: any) => any ? ReturnType<typeof MoveItemDown> : never
    | ReturnType<typeof StartEdit>
    | ReturnType<typeof SyncDraft>
    | ReturnType<typeof SyncEditDraft>
    | ReturnType<typeof CancelEdit>
    | ReturnType<typeof UpdateTodoText>;
