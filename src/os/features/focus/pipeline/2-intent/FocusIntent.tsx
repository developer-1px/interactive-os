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
import { ACTIVATE } from "@/os-new/2-command/activate/command.ts";
import { DELETE } from "@/os-new/2-command/delete/command.ts";
import { ESCAPE } from "@/os-new/2-command/escape/command.ts";
import { FOCUS } from "@/os-new/2-command/focus/command.ts";
import { NAVIGATE } from "@/os-new/2-command/navigate/command.ts";
import { RECOVER } from "@/os-new/2-command/focus/RECOVER.ts";
import { SELECT } from "@/os-new/2-command/select/command.ts";
import { SELECT_ALL } from "@/os-new/2-command/select/all.ts";
import { SYNC_FOCUS } from "@/os-new/2-command/focus/sync.ts";
import { TAB } from "@/os-new/2-command/tab/command.ts";
import { TOGGLE } from "@/os-new/2-command/toggle/command.ts";

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
