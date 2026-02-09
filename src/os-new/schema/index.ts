// Command types
export type {
    OSCommand,
    OSContext,
    OSResult,
    DOMEffect,
    DOMQueries,
} from "./types.ts";

// Config types
export type {
    Direction,
    Orientation,
    TabDirection,
    NavigateConfig,
    TabConfig,
    SelectConfig,
    ActivateConfig,
    DismissConfig,
    ProjectConfig,
    FocusGroupConfig,
} from "./types.ts";

// Config defaults
export {
    DEFAULT_NAVIGATE,
    DEFAULT_TAB,
    DEFAULT_SELECT,
    DEFAULT_ACTIVATE,
    DEFAULT_DISMISS,
    DEFAULT_PROJECT,
    DEFAULT_CONFIG,
} from "./types.ts";

// Command identity constants
export {
    OS_COMMANDS,
    type OSCommandType,
    type OSNavigatePayload,
    type OSFocusPayload,
    type OSSelectPayload,
    type OSActivatePayload,
} from "./commands.ts";
