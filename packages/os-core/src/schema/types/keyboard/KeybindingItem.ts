export interface KeybindingItem<T = string> {
  key: string;
  command: T;
  args?: unknown;
  when?: string;
  preventDefault?: boolean;
  allowInInput?: boolean;
  groupId?: string;
  zoneId?: string;
}
