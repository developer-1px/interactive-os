import type { BaseCommand } from "@kernel/core/tokens";
import type { FocusStackEntry } from "../types/focus/FocusStack";

export interface OverlayEntry {
  /** Unique overlay ID */
  id: string;
  /** Overlay type (determines behavior preset) */
  type: "dialog" | "alertdialog" | "menu" | "popover" | "tooltip";
  /** Initial focus entry hint: "first" (default) or "last" (ArrowUp) */
  entry?: "first" | "last";
  /** data-trigger-id of the trigger that opened this overlay (for focus restore) */
  triggerId?: string;
}

/** Notification types: toast (polite, auto-dismiss) vs alert (assertive, persistent) */
export type NotificationType = "toast" | "alert";

export interface NotificationEntry {
  /** Unique notification ID */
  id: string;
  /** Notification type — determines role and auto-dismiss behavior */
  type: NotificationType;
  /** Message to display */
  message: string;
  /** Optional action label (e.g. "Undo") */
  actionLabel?: string;
  /** Optional command to dispatch when action is clicked */
  actionCommand?: BaseCommand;
  /** Duration in ms before auto-dismiss (0 = manual only). Default: 4000 for toast, 0 for alert */
  duration: number;
  /** Timestamp when notification was created */
  createdAt: number;
}

export interface DragState {
  /** Whether a drag operation is in progress */
  isDragging: boolean;
  /** Zone where the drag is happening */
  zoneId: string | null;
  /** ID of the item being dragged */
  dragItemId: string | null;
  /** ID of the item currently being hovered over */
  overItemId: string | null;
  /** Drop position relative to overItemId */
  overPosition: "before" | "after" | null;
}

export interface OSState {
  focus: {
    /** The ID of the currently active zone */
    activeZoneId: string | null;
    /** Stack of saved focus states (modal/overlay restoration) */
    focusStack: FocusStackEntry[];
    /** Map of zone IDs to their specific state */
    zones: Record<string, ZoneState>;
  };
  overlays: {
    /** Stack of open overlays (top = most recent) */
    stack: OverlayEntry[];
  };
  notifications: {
    /** Active notification stack (bottom = oldest, top = newest) */
    stack: NotificationEntry[];
  };
  /** Drag-and-drop state for reorder operations */
  drag: DragState;
}

/**
 * ARIA item state — stored directly, not derived.
 *
 * DOM is the source of truth. Headless mirrors DOM.
 * Commands write here directly; compute.ts reads directly.
 * No derivation, no config-driven lookups.
 */
export interface AriaItemState {
  "aria-selected"?: boolean;
  "aria-checked"?: boolean;
  "aria-pressed"?: boolean;
  "aria-expanded"?: boolean;
}

export interface ZoneState {
  /** Zone ID — self-identifying for functions that receive ZoneState without key context */
  zoneId: string;

  // Cursor Slice
  focusedItemId: string | null;
  lastFocusedId: string | null;

  // Field Slice
  editingItemId: string | null;
  /** Per-field caret offset cache (fieldId → character offset) */
  caretPositions: Record<string, number>;

  // Spatial Slice
  stickyX: number | null;
  stickyY: number | null;

  // ARIA Item State Slice — direct mirror of DOM aria-* attributes.
  // Commands write to items[id]["aria-*"] directly.
  // compute.ts reads items[id] directly — no derivation.
  items: Record<string, AriaItemState>;

  // Range selection anchor — needed to know WHERE the anchor is
  // for Shift+Arrow range selection. Order comes from dom-items inject.
  selectionAnchor: string | null;

  // Value Slice (slider, spinbutton, separator)
  /** Per-item current values for value-axis widgets (itemId → number) */
  valueNow: Record<string, number>;
  /** Per-item restore values for separator collapse/restore toggle (itemId → number) */
  valueRestore: Record<string, number>;
}
