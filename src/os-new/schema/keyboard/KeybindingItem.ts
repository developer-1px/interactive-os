import type { LogicNode } from "../logic/LogicNode";

export interface KeybindingItem<T = string> {
  key: string;
  command: T;
  args?: any;
  when?: string | LogicNode;
  preventDefault?: boolean;
  allowInInput?: boolean;
  groupId?: string;
  zoneId?: string;
}
