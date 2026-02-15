/**
 * HistoryEntry — 앱 히스토리 단위 엔트리
 */
export interface HistoryEntry {
  command: { type: string; payload?: any };
  timestamp: number;
  snapshot?: any;
  /** Captured focusedItemId for focus restoration on undo */
  focusedItemId?: string | null;
  /** Transaction group ID — entries with same groupId are undone/redone atomically */
  groupId?: string;
}

/**
 * HistoryState — undo/redo 스택
 */
export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}
