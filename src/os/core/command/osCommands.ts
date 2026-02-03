/**
 * [OS Core] Standard Command Identities
 * 
 * These are the well-known command IDs that Antigravity OS understands.
 * Apps should implement these to participate in the unified interaction stream.
 */
export const OS_COMMANDS = {
    // --- Navigation (The "Physics" of Focus) ---
    NAVIGATE: "OS_NAVIGATE",
    FOCUS: "OS_FOCUS",

    // --- Clipboard (The "Data" Transfer) ---
    COPY: "OS_COPY",
    CUT: "OS_CUT",
    PASTE: "OS_PASTE",

    // --- History (The "Time" Control) ---
    UNDO: "OS_UNDO",
    REDO: "OS_REDO",

    // --- Window/Shell (The "Desktop" Layer) ---
    TOGGLE_INSPECTOR: "OS_TOGGLE_INSPECTOR",
    EXIT: "OS_EXIT",
} as const;

export type OSCommandType = typeof OS_COMMANDS[keyof typeof OS_COMMANDS];

export interface OSNavigatePayload {
    direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
    sourceId: string | null;
    targetId?: string | null; // If known by Physics engine
}

export interface OSFocusPayload {
    id: string | null;
    sourceId?: string | null;
}

export type OSCommand =
    | { type: typeof OS_COMMANDS.NAVIGATE; payload: OSNavigatePayload }
    | { type: typeof OS_COMMANDS.FOCUS; payload: OSFocusPayload }
    | { type: typeof OS_COMMANDS.UNDO; payload?: any }
    | { type: typeof OS_COMMANDS.REDO; payload?: any }
    | { type: typeof OS_COMMANDS.COPY; payload?: any }
    | { type: typeof OS_COMMANDS.CUT; payload?: any }
    | { type: typeof OS_COMMANDS.PASTE; payload?: any }
    | { type: typeof OS_COMMANDS.TOGGLE_INSPECTOR; payload?: any }
    | { type: typeof OS_COMMANDS.EXIT; payload?: any };
