import type { FocusStackEntry } from "../schemas/focus/FocusStack";

/** Global single clipboard — one at a time, source-tagged for accept matching. */
export interface ClipboardState {
  /** Source collection identifier (appName:zoneName). null = empty. */
  source: string | null;
  /** Stored items (type-agnostic, collection owns interpretation). */
  items: unknown[];
  /** Was this a cut operation? */
  isCut: boolean;
}

export interface OverlayEntry {
  /** Unique overlay ID */
  id: string;
  /** Overlay type (determines behavior preset) */
  type: "dialog" | "alertdialog" | "menu" | "popover" | "tooltip";
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
  /** 클립보드 서브시스템 — 글로벌 단일 */
  clipboard: ClipboardState;
  overlays: {
    /** Stack of open overlays (top = most recent) */
    stack: OverlayEntry[];
  };
}

export interface ZoneState {
  // Cursor Slice
  focusedItemId: string | null;
  lastFocusedId: string | null;
  recoveryTargetId: string | null;

  // Field Slice
  editingItemId: string | null;

  // Spatial Slice
  stickyX: number | null;
  stickyY: number | null;

  // Selection Slice
  selection: string[];
  selectionAnchor: string | null;

  // Expansion Slice
  expandedItems: string[];
}
