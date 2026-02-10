import type { CommandDefinition } from "@os/entities/CommandDefinition";
import { OS_COMMANDS as SHELL_COMMANDS } from "@/os-new/schema/command/OSCommands";
import { InspectorStore } from "@os/inspector/InspectorStore";

export const OS_COMMANDS = SHELL_COMMANDS;

// --- Clipboard Support ---
const OS_CLIPBOARD_COMMANDS: CommandDefinition<any, any>[] = [
  { id: SHELL_COMMANDS.COPY, run: (state) => state },
  { id: SHELL_COMMANDS.PASTE, run: (state) => state },
  { id: SHELL_COMMANDS.CUT, run: (state) => state },
];

// --- Field Lifecycle ---
const OS_FIELD_COMMANDS: CommandDefinition<any, any>[] = [
  { id: SHELL_COMMANDS.FIELD_START_EDIT, run: (state) => state },
  { id: SHELL_COMMANDS.FIELD_COMMIT, run: (state) => state },
  { id: SHELL_COMMANDS.FIELD_CANCEL, run: (state) => state },
];

// --- Navigation ---
const OS_NAV_COMMANDS: CommandDefinition<any, any>[] = [
  { id: SHELL_COMMANDS.NAVIGATE, run: (state) => state },
  { id: "OS_TAB", run: (state) => state },
  { id: "OS_TAB_PREV", run: (state) => state },
];

// --- Selection ---
const OS_SELECTION_COMMANDS: CommandDefinition<any, any>[] = [
  { id: SHELL_COMMANDS.SELECT, run: (state) => state },
  { id: SHELL_COMMANDS.SELECT_ALL, run: (state) => state },
  { id: SHELL_COMMANDS.DESELECT_ALL, run: (state) => state },
];

// --- Activation ---
const OS_ACTIVATION_COMMANDS: CommandDefinition<any, any>[] = [
  { id: SHELL_COMMANDS.ACTIVATE, run: (state) => state },
];

// --- Focus & Shell ---
const OS_SHELL_COMMANDS: CommandDefinition<any, any>[] = [
  { id: SHELL_COMMANDS.FOCUS, run: (state) => state },
  {
    id: SHELL_COMMANDS.TOGGLE_INSPECTOR,
    run: (state) => {
      // Side effect: toggle global Inspector store
      InspectorStore.toggle();
      console.log("[OS Command] Inspector toggled:", InspectorStore.isOpen());
      return state;
    },
  },
  { id: SHELL_COMMANDS.ESCAPE, run: (state) => state },
  { id: SHELL_COMMANDS.UNDO, run: (state) => state },
  { id: SHELL_COMMANDS.REDO, run: (state) => state },
];

export const ALL_OS_COMMANDS = [
  ...OS_CLIPBOARD_COMMANDS,
  ...OS_FIELD_COMMANDS,
  ...OS_NAV_COMMANDS,
  ...OS_SELECTION_COMMANDS,
  ...OS_ACTIVATION_COMMANDS,
  ...OS_SHELL_COMMANDS,
];
