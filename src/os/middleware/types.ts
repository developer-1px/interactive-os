/**
 * OS Middleware Types
 *
 * Defines the state shape contract for OS built-in middleware.
 * Apps that conform to this shape get automatic navigation and history support.
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
 * OS middleware signature — generic over any state shape.
 */
export type OSMiddleware = <S>(
    nextState: S,
    action: { type: string; payload?: any },
    prevState: S,
) => S;
