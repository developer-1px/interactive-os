/**
 * FocusIntent - OS Focus Command Router
 * 
 * Single entry point for all focus-related OS commands.
 * Routes commands to pure OS commands via runOS.
 */

import { useCommandListener } from '../../../command/hooks/useCommandListener';
import { OS_COMMANDS, type OSNavigatePayload } from '../../../command/definitions/commandsShell';
import { NAVIGATE, TAB, SELECT, ACTIVATE, FOCUS, DISMISS, COPY, CUT, PASTE, TOGGLE, DELETE, UNDO, REDO } from './commands';
import { runOS } from '../core/osCommand';

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
            }
        },
        // --- Tab ---
        {
            command: OS_COMMANDS.TAB,
            handler: ({ payload }) => {
                runOS(TAB, (payload ?? {}) as { direction?: 'forward' | 'backward' });
            }
        },
        // --- Select ---
        {
            command: OS_COMMANDS.SELECT,
            handler: ({ payload }) => {
                const selectPayload = (payload ?? {}) as { targetId?: string; zoneId?: string };
                runOS(SELECT, selectPayload, selectPayload.zoneId);
            }
        },
        // --- Activate ---
        {
            command: OS_COMMANDS.ACTIVATE,
            handler: ({ payload }) => {
                runOS(ACTIVATE, (payload ?? {}) as { targetId?: string });
            }
        },
        // --- Focus ---
        {
            command: OS_COMMANDS.FOCUS,
            handler: ({ payload }) => {
                runOS(FOCUS, payload as { id: string; zoneId: string });
            }
        },
        // --- Dismiss ---
        {
            command: OS_COMMANDS.DISMISS,
            handler: () => {
                runOS(DISMISS, {});
            }
        },
        // --- Clipboard ---
        {
            command: OS_COMMANDS.COPY,
            handler: ({ payload }) => {
                runOS(COPY, (payload ?? {}) as { targetId?: string });
            }
        },
        {
            command: OS_COMMANDS.CUT,
            handler: ({ payload }) => {
                runOS(CUT, (payload ?? {}) as { targetId?: string });
            }
        },
        {
            command: OS_COMMANDS.PASTE,
            handler: ({ payload }) => {
                runOS(PASTE, (payload ?? {}) as { targetId?: string });
            }
        },
        {
            command: OS_COMMANDS.TOGGLE,
            handler: ({ payload }) => {
                runOS(TOGGLE, (payload ?? {}) as { targetId?: string });
            }
        },
        // --- Editing ---
        {
            command: OS_COMMANDS.DELETE,
            handler: ({ payload }) => {
                runOS(DELETE, (payload ?? {}) as { targetId?: string });
            }
        },
        {
            command: OS_COMMANDS.UNDO,
            handler: () => {
                runOS(UNDO, undefined);
            }
        },
        {
            command: OS_COMMANDS.REDO,
            handler: () => {
                runOS(REDO, undefined);
            }
        },
    ]);

    return null;
}

FocusIntent.displayName = 'FocusIntent';

