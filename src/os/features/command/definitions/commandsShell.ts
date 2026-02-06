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
    TAB: "OS_TAB",
    TAB_PREV: "OS_TAB_PREV",

    // --- Selection (The "Selection" of Items) ---
    SELECT: "OS_SELECT",
    SELECT_ALL: "OS_SELECT_ALL",
    DESELECT_ALL: "OS_DESELECT_ALL",

    // --- Activation (The "Action" Trigger) ---
    ACTIVATE: "OS_ACTIVATE",

    // --- Dismissal (The "Escape" Trigger) ---
    DISMISS: "OS_DISMISS",

    // --- Field Editing (The "Edit" Lifecycle) ---
    FIELD_START_EDIT: "OS_FIELD_START_EDIT",
    FIELD_COMMIT: "OS_FIELD_COMMIT",
    FIELD_CANCEL: "OS_FIELD_CANCEL",
    FIELD_SYNC: "OS_FIELD_SYNC",
    FIELD_BLUR: "OS_FIELD_BLUR",

    // --- Clipboard (The "Data" Transfer) ---
    COPY: "OS_COPY",
    CUT: "OS_CUT",
    PASTE: "OS_PASTE",

    // --- Editing (The "Modification" Actions) ---
    TOGGLE: "OS_TOGGLE",  // Space - checkbox/multi-select toggle
    DELETE: "OS_DELETE",

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

export interface OSSelectPayload {
    /** 선택할 아이템 ID (없으면 현재 포커스된 아이템) */
    targetId?: string;
    /** 선택 모드: toggle(Ctrl), range(Shift), replace(기본) */
    mode?: 'toggle' | 'range' | 'replace';
    /** explicit user action (Space key) vs auto-selection (click followFocus) */
    isExplicitAction?: boolean;
}

export interface OSActivatePayload {
    /** 활성화할 아이템 ID (없으면 현재 포커스된 아이템) */
    targetId?: string;
}

export type OSCommand =
    | { type: typeof OS_COMMANDS.NAVIGATE; payload: OSNavigatePayload }
    | { type: typeof OS_COMMANDS.FOCUS; payload: OSFocusPayload }
    | { type: typeof OS_COMMANDS.TAB; payload?: void }
    | { type: typeof OS_COMMANDS.TAB_PREV; payload?: void }
    | { type: typeof OS_COMMANDS.SELECT; payload?: OSSelectPayload }
    | { type: typeof OS_COMMANDS.SELECT_ALL; payload?: void }
    | { type: typeof OS_COMMANDS.DESELECT_ALL; payload?: void }
    | { type: typeof OS_COMMANDS.ACTIVATE; payload?: OSActivatePayload }
    | { type: typeof OS_COMMANDS.DISMISS; payload?: void }
    | { type: typeof OS_COMMANDS.FIELD_START_EDIT; payload?: { fieldId?: string } }
    | { type: typeof OS_COMMANDS.FIELD_COMMIT; payload?: { fieldId?: string } }
    | { type: typeof OS_COMMANDS.FIELD_CANCEL; payload?: { fieldId?: string } }
    | { type: typeof OS_COMMANDS.UNDO; payload?: any }
    | { type: typeof OS_COMMANDS.REDO; payload?: any }
    | { type: typeof OS_COMMANDS.COPY; payload?: any }
    | { type: typeof OS_COMMANDS.CUT; payload?: any }
    | { type: typeof OS_COMMANDS.PASTE; payload?: any }
    | { type: typeof OS_COMMANDS.DELETE; payload?: any }
    | { type: typeof OS_COMMANDS.TOGGLE_INSPECTOR; payload?: any }
    | { type: typeof OS_COMMANDS.EXIT; payload?: any };

