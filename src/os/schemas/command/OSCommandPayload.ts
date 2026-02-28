import type { OS_COMMANDS } from "./OSCommands.ts";

export interface OSNavigatePayload {
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT" | "HOME" | "END";
  sourceId: string | null;
  targetId?: string | null;
  select?: "range" | "toggle";
}

export interface OSFocusPayload {
  id: string | null;
  sourceId?: string | null;
}

export interface OSSelectPayload {
  targetId?: string;
  mode?: "toggle" | "range" | "replace";
  isExplicitAction?: boolean;
}

export interface OSActivatePayload {
  targetId?: string;
}

export type OSCommandUnion =
  | { type: typeof OS_COMMANDS.OS_NAVIGATE; payload: OSNavigatePayload }
  | { type: typeof OS_COMMANDS.OS_FOCUS; payload: OSFocusPayload }
  | { type: typeof OS_COMMANDS.OS_TAB; payload?: undefined }
  | { type: typeof OS_COMMANDS.OS_TAB_PREV; payload?: undefined }
  | { type: typeof OS_COMMANDS.OS_SELECT; payload?: OSSelectPayload }
  | { type: typeof OS_COMMANDS.OS_SELECT_ALL; payload?: undefined }
  | { type: typeof OS_COMMANDS.OS_DESELECT_ALL; payload?: undefined }
  | { type: typeof OS_COMMANDS.OS_ACTIVATE; payload?: OSActivatePayload }
  | { type: typeof OS_COMMANDS.OS_ESCAPE; payload?: undefined }
  | {
    type: typeof OS_COMMANDS.OS_FIELD_START_EDIT;
    payload?: { fieldId?: string };
  }
  | { type: typeof OS_COMMANDS.OS_FIELD_COMMIT; payload?: { fieldId?: string } }
  | { type: typeof OS_COMMANDS.OS_FIELD_CANCEL; payload?: { fieldId?: string } }
  | { type: typeof OS_COMMANDS.OS_UNDO; payload?: undefined }
  | { type: typeof OS_COMMANDS.OS_REDO; payload?: undefined }
  | { type: typeof OS_COMMANDS.OS_COPY; payload?: undefined }
  | { type: typeof OS_COMMANDS.OS_CUT; payload?: undefined }
  | { type: typeof OS_COMMANDS.OS_PASTE; payload?: undefined }
  | { type: typeof OS_COMMANDS.OS_DELETE; payload?: undefined }
  | { type: typeof OS_COMMANDS.OS_TOGGLE_INSPECTOR; payload?: undefined };
