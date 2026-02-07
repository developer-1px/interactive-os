import type { LogicNode } from "@os/features/logic/LogicNode";

// Moved from src/os/core/input/keybinding.ts
export interface KeybindingItem<T = string> {
  key: string;
  command: T;
  args?: any;
  when?: string | LogicNode;
  preventDefault?: boolean;
  allowInInput?: boolean;
  groupId?: string; // Metadata: Which group did this come from?
  zoneId?: string; // Legacy alias for groupId
}
