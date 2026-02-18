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
  | { type: typeof OS_COMMANDS.NAVIGATE; payload: OSNavigatePayload }
  | { type: typeof OS_COMMANDS.FOCUS; payload: OSFocusPayload }
  | { type: typeof OS_COMMANDS.TAB; payload?: undefined }
  | { type: typeof OS_COMMANDS.TAB_PREV; payload?: undefined }
  | { type: typeof OS_COMMANDS.SELECT; payload?: OSSelectPayload }
  | { type: typeof OS_COMMANDS.SELECT_ALL; payload?: undefined }
  | { type: typeof OS_COMMANDS.DESELECT_ALL; payload?: undefined }
  | { type: typeof OS_COMMANDS.ACTIVATE; payload?: OSActivatePayload }
  | { type: typeof OS_COMMANDS.ESCAPE; payload?: undefined }
  | {
      type: typeof OS_COMMANDS.FIELD_START_EDIT;
      payload?: { fieldId?: string };
    }
  | { type: typeof OS_COMMANDS.FIELD_COMMIT; payload?: { fieldId?: string } }
  | { type: typeof OS_COMMANDS.FIELD_CANCEL; payload?: { fieldId?: string } }
  | { type: typeof OS_COMMANDS.UNDO; payload?: undefined }
  | { type: typeof OS_COMMANDS.REDO; payload?: undefined }
  | { type: typeof OS_COMMANDS.COPY; payload?: undefined }
  | { type: typeof OS_COMMANDS.CUT; payload?: undefined }
  | { type: typeof OS_COMMANDS.PASTE; payload?: undefined }
  | { type: typeof OS_COMMANDS.DELETE; payload?: undefined }
  | { type: typeof OS_COMMANDS.TOGGLE_INSPECTOR; payload?: undefined }
  | { type: typeof OS_COMMANDS.RECOVER; payload?: undefined };
