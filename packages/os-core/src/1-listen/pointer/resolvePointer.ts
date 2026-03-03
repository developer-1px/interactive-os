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
  /** true when the target zone has value.mode === "continuous" (slider) */
  isSlider: boolean;
}

export interface PointerMoveInput {
  clientX: number;
  clientY: number;
}

export type GesturePhase = "IDLE" | "PENDING" | "DRAG" | "SLIDER_DRAG";

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
  | { gesture: "SLIDER_DRAG_END"; state: GestureState }
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

  // Slider: immediate SLIDER_DRAG — no threshold, instant response
  if (input.isSlider && input.itemId && input.zoneId) {
    return {
      phase: "SLIDER_DRAG",
      startX: input.clientX,
      startY: input.clientY,
      itemId: input.itemId,
      zoneId: input.zoneId,
    };
  }

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
  // SLIDER_DRAG: stays in SLIDER_DRAG (value update is side-effect in listener)
  if (state.phase === "SLIDER_DRAG") return state;

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

    case "SLIDER_DRAG":
      return {
        gesture: "SLIDER_DRAG_END",
        state: IDLE_STATE,
      };

    default:
      return {
        gesture: "NONE",
        state: IDLE_STATE,
      };
  }
}

// ═══════════════════════════════════════════════════════════════════
// resolveSliderValue — Pure: pointer position → snapped value
// ═══════════════════════════════════════════════════════════════════

export interface SliderValueInput {
  clientX: number;
  clientY: number;
  rect: { left: number; top: number; width: number; height: number };
  min: number;
  max: number;
  step: number;
  orientation: "horizontal" | "vertical" | "both";
}

export function resolveSliderValue(input: SliderValueInput): number {
  const { clientX, clientY, rect, min, max, step, orientation } = input;

  // Calculate ratio based on orientation
  let ratio: number;
  if (orientation === "vertical") {
    // Vertical: top = max, bottom = min (inverted)
    ratio = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  } else {
    // Horizontal (default, also for "both")
    ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }

  // Map ratio to [min, max]
  const rawValue = min + ratio * (max - min);

  // Snap to step
  const snapped = Math.round(rawValue / step) * step;

  // Round to step precision to avoid floating point issues
  const precision = (step.toString().split(".")[1] || "").length;
  const rounded = Number(snapped.toFixed(precision));

  // Clamp to [min, max]
  return Math.min(max, Math.max(min, rounded));
}
