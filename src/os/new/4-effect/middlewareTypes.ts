/**
 * OS Middleware Types — 순수 타입 정의
 *
 * History, Effects, Middleware 계약.
 * Apps가 이 shape을 따르면 자동으로 navigation/history 지원.
 */

// ═══════════════════════════════════════════════════════════════════
// History Types (shared across all apps)
// ═══════════════════════════════════════════════════════════════════

export interface HistoryEntry {
    command: { type: string; payload?: any };
    timestamp: number;
    snapshot?: any;
    /** Captured focusedItemId for focus restoration on undo */
    focusedItemId?: string | null;
}

export interface HistoryState {
    past: HistoryEntry[];
    future: HistoryEntry[];
}

// ═══════════════════════════════════════════════════════════════════
// OS Middleware Contract
// ═══════════════════════════════════════════════════════════════════

/**
 * Minimum state shape for OS middleware to operate.
 * Apps that include `effects` get navigation middleware.
 * Apps that include `history` get undo/redo history recording.
 */
export interface OSManagedState {
    effects?: { type: string;[key: string]: any }[];
    history?: HistoryState;
    data?: any;
    ui?: any;
}

/**
 * OS middleware signature — Redux-style next pattern.
 * Middleware can execute logic before next() (PRE) and after next() (POST).
 */
export type Next<S, A> = (state: S, action: A) => S;
export type OSMiddleware<S = any, A = any> = (next: Next<S, A>) => Next<S, A>;
