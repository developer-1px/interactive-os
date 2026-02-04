import type { LogicNode } from "@os/features/logic/LogicNode";

// Moved from src/os/core/input/keybinding.ts
export interface KeybindingItem<T = string> {
  key: string;
  command: T;
  args?: any;
  when?: string | LogicNode;
  preventDefault?: boolean;
  allowInInput?: boolean;
  zoneId?: string; // Metadata: Which zone did this come from?
}
