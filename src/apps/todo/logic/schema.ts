export interface TodoContext {
  // Environment
  activeZone: "sidebar" | "listView" | "boardView" | null;
  focusPath?: string[];
  isEditing: boolean;
  isDraftFocused: boolean;
}
