/**
 * resolvePointer — Pure gesture recognition logic
 *
 * State Machine: IDLE → PENDING → (CLICK | DRAG) → IDLE
 *
 * This is the "translate" half of the Pointer Listener.
 * No DOM access. No side effects. Pure function.
 *
 * "Same finger, same listener." — Gesture Recognizer pattern.
 *
 * @see docs/1-project/unified-pointer-listener/spec.md §1.1, §2
 */

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════

const DRAG_THRESHOLD = 5; // px

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface PointerInput {
    clientX: number;
    clientY: number;
    button: number;
    hasDragHandle: boolean;
    hasItemId: boolean;
    hasZone: boolean;
    itemId: string | null;
    zoneId: string | null;
}

export interface PointerMoveInput {
    clientX: number;
    clientY: number;
}

export type GesturePhase = "IDLE" | "PENDING" | "DRAG";

export interface GestureState {
    phase: GesturePhase;
    startX?: number;
    startY?: number;
    itemId?: string | null;
    zoneId?: string | null;
    hasDragHandle?: boolean;
}

export type GestureResult =
    | {
        gesture: "CLICK";
        state: GestureState;
        itemId: string | null;
        zoneId: string | null;
    }
    | { gesture: "DRAG_END"; state: GestureState }
    | { gesture: "NONE"; state: GestureState };

// ═══════════════════════════════════════════════════════════════════
// State Factory
// ═══════════════════════════════════════════════════════════════════

const IDLE_STATE: GestureState = { phase: "IDLE" };

export function createIdleState(): GestureState {
    return IDLE_STATE;
}

// ═══════════════════════════════════════════════════════════════════
// resolvePointerDown — IDLE → PENDING
// ═══════════════════════════════════════════════════════════════════

export function resolvePointerDown(
    state: GestureState,
    input: PointerInput,
): GestureState {
    // Only left mouse button
    if (input.button !== 0) return state;

    // Nothing to interact with
    if (!input.hasItemId && !input.hasZone) return state;

    return {
        phase: "PENDING",
        startX: input.clientX,
        startY: input.clientY,
        itemId: input.itemId,
        zoneId: input.zoneId,
        hasDragHandle: input.hasDragHandle,
    };
}

// ═══════════════════════════════════════════════════════════════════
// resolvePointerMove — PENDING → DRAG (if threshold + handle)
// ═══════════════════════════════════════════════════════════════════

export function resolvePointerMove(
    state: GestureState,
    input: PointerMoveInput,
): GestureState {
    // Only PENDING can transition
    if (state.phase !== "PENDING") return state;

    // Without drag handle, movement doesn't trigger drag
    if (!state.hasDragHandle) return state;

    const dx = input.clientX - (state.startX ?? 0);
    const dy = input.clientY - (state.startY ?? 0);

    if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
        return state;
    }

    // Threshold exceeded with drag handle → DRAG
    return {
        ...state,
        phase: "DRAG",
    };
}

// ═══════════════════════════════════════════════════════════════════
// resolvePointerUp — PENDING → CLICK / DRAG → DRAG_END / IDLE → NONE
// ═══════════════════════════════════════════════════════════════════

export function resolvePointerUp(state: GestureState): GestureResult {
    switch (state.phase) {
        case "PENDING":
            return {
                gesture: "CLICK",
                state: IDLE_STATE,
                itemId: state.itemId ?? null,
                zoneId: state.zoneId ?? null,
            };

        case "DRAG":
            return {
                gesture: "DRAG_END",
                state: IDLE_STATE,
            };

        default:
            return {
                gesture: "NONE",
                state: IDLE_STATE,
            };
    }
}
