/**
 * transaction — Transaction types and pure state-diff utility.
 *
 * All stateful transaction log management lives in createKernel closures.
 * This file only exports types and the pure computeChanges function.
 */

// ─── Types ───

export type StateDiff = {
  path: string;
  from: unknown;
  to: unknown;
};

export type Transaction = {
  id: number;
  timestamp: number;
  command: { type: string; payload: unknown };
  handlerScope: string;
  bubblePath: string[];
  effects: Record<string, unknown> | null;
  changes: StateDiff[];
  stateBefore: unknown;
  stateAfter: unknown;
};

// ─── State Diff (pure function) ───

export function computeChanges(before: unknown, after: unknown): StateDiff[] {
  if (before === after) return [];

  const diffs: StateDiff[] = [];

  function walk(a: unknown, b: unknown, path: string, depth: number): void {
    if (a === b) return;
    if (depth > 10) {
      diffs.push({ path, from: a, to: b });
      return;
    }

    const aIsObj = a !== null && typeof a === "object" && !Array.isArray(a);
    const bIsObj = b !== null && typeof b === "object" && !Array.isArray(b);

    if (aIsObj && bIsObj) {
      const aObj = a as Record<string, unknown>;
      const bObj = b as Record<string, unknown>;
      const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
      for (const key of keys) {
        walk(aObj[key], bObj[key], path ? `${path}.${key}` : key, depth + 1);
      }
      return;
    }

    const aIsArr = Array.isArray(a);
    const bIsArr = Array.isArray(b);

    if (aIsArr && bIsArr) {
      const maxLen = Math.max(a.length, b.length);
      for (let i = 0; i < maxLen; i++) {
        walk(a[i], b[i], `${path}[${i}]`, depth + 1);
      }
      return;
    }

    diffs.push({ path, from: a, to: b });
  }

  walk(before, after, "", 0);
  return diffs;
}
