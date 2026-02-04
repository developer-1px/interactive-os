/**
 * OS Command Registry
 * 
 * Re-exports all OS commands from the modular command system.
 * This file is kept for backward compatibility.
 */

export {
    defineOSCommand,
    Focus,
    Navigate,
    Tab,
    TabPrev,
    ExitZone,
    Undo,
    Redo,
    Copy,
    Cut,
    Paste,
    ToggleInspector,
    ALL_OS_COMMANDS
} from "./commands";
