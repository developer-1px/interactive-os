/**
 * OS Commands - Aggregate Export
 * 
 * All OS-level commands are split by domain and re-exported here.
 */

// Navigation
export { Focus, Navigate, Tab, TabPrev, ExitZone, defineOSCommand } from "./navigation";

// Clipboard & History
export { Undo, Redo, Copy, Cut, Paste } from "./clipboard";

// Shell & Base Commands
export { ToggleInspector, SetFocus, Patch } from "./shell";

// Field Editing
export { FieldStartEdit, FieldCommit, FieldCancel } from "./field";

// Aggregate for auto-registration
import { Focus, Navigate, Tab, TabPrev, ExitZone } from "./navigation";
import { Undo, Redo, Copy, Cut, Paste } from "./clipboard";
import { ToggleInspector, SetFocus, Patch } from "./shell";
import { FieldStartEdit, FieldCommit, FieldCancel } from "./field";

export const ALL_OS_COMMANDS = [
    Focus,
    Navigate,
    Tab,
    TabPrev,
    Undo,
    Redo,
    Copy,
    Cut,
    Paste,
    ToggleInspector,
    ExitZone,
    SetFocus,
    Patch,
    FieldStartEdit,
    FieldCommit,
    FieldCancel,
];

