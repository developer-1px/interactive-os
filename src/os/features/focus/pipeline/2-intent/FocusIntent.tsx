/**
 * FocusIntent - OS Focus Command Router
 *
 * Routes focus-related OS commands to pure OS commands via runOS.
 * Clipboard (COPY/CUT/PASTE) → ClipboardIntent
 * History (UNDO/REDO) → HistoryIntent
 */

import {
  OS_COMMANDS,
  type OSNavigatePayload,
} from "../../../command/definitions/commandsShell";
import { useCommandListener } from "../../../command/hooks/useCommandListener";
import { runOS } from "../core/osCommand";
import {
  ACTIVATE,
  DELETE,
  ESCAPE,
  FOCUS,
  NAVIGATE,
  RECOVER,
  SELECT,
  SELECT_ALL,
  SYNC_FOCUS,
  TAB,
  TOGGLE,
} from "./commands";

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function FocusIntent() {
  useCommandListener([
    // --- Navigate ---
    {
      command: OS_COMMANDS.NAVIGATE,
      handler: ({ payload }) => {
        runOS(NAVIGATE, payload as OSNavigatePayload);
      },
    },
    // --- Tab ---
    {
      command: OS_COMMANDS.TAB,
      handler: ({ payload }) => {
        runOS(TAB, (payload ?? {}) as { direction?: "forward" | "backward" });
      },
    },
    {
      command: OS_COMMANDS.TAB_PREV,
      handler: () => {
        runOS(TAB, { direction: "backward" });
      },
    },
    // --- Select ---
    {
      command: OS_COMMANDS.SELECT,
      handler: ({ payload }) => {
        const selectPayload = (payload ?? {}) as {
          targetId?: string;
          zoneId?: string;
        };
        runOS(SELECT, selectPayload, selectPayload.zoneId);
      },
    },
    // --- Select All ---
    {
      command: OS_COMMANDS.SELECT_ALL,
      handler: () => {
        runOS(SELECT_ALL, undefined);
      },
    },
    // --- Activate ---
    {
      command: OS_COMMANDS.ACTIVATE,
      handler: ({ payload }) => {
        runOS(ACTIVATE, (payload ?? {}) as { targetId?: string });
      },
    },
    // --- Focus ---
    {
      command: OS_COMMANDS.FOCUS,
      handler: ({ payload }) => {
        const p = payload as { id: string; zoneId: string };
        runOS(FOCUS, p, p.zoneId);
      },
    },
    // --- Recover ---
    {
      command: OS_COMMANDS.SYNC_FOCUS,
      handler: ({ payload }) => {
        const p = payload as { id: string; zoneId: string };
        runOS(SYNC_FOCUS, p, p.zoneId);
      },
    },
    {
      command: OS_COMMANDS.RECOVER,
      handler: () => {
        runOS(RECOVER, {});
      },
    },
    // --- Escape ---
    {
      command: OS_COMMANDS.ESCAPE,
      handler: () => {
        runOS(ESCAPE, {});
      },
    },
    // --- Editing (TOGGLE + DELETE remain here due to selection coupling) ---
    {
      command: OS_COMMANDS.TOGGLE,
      handler: ({ payload }) => {
        runOS(TOGGLE, (payload ?? {}) as { targetId?: string });
      },
    },
    {
      command: OS_COMMANDS.DELETE,
      handler: ({ payload }) => {
        runOS(DELETE, (payload ?? {}) as { targetId?: string });
      },
    },
  ]);

  return null;
}

FocusIntent.displayName = "FocusIntent";
