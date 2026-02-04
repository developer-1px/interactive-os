/**
 * OS Commands - Aggregate Export
 * 
 * All OS-level commands are split by domain and re-exported here.
 */

// Navigation
export { Focus, Navigate, Tab, TabPrev, ExitZone, defineOSCommand } from "./navigation";

// Clipboard & History
export { Undo, Redo, Copy, Cut, Paste } from "./clipboard";

// Shell
export { ToggleInspector } from "./shell";

// Aggregate for auto-registration
import { Focus, Navigate, Tab, TabPrev, ExitZone } from "./navigation";
import { Undo, Redo, Copy, Cut, Paste } from "./clipboard";
import { ToggleInspector } from "./shell";

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
    ExitZone
];
