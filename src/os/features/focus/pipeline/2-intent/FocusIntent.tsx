/**
 * FocusIntent - OS Focus Command Router
 * 
 * Single entry point for all focus-related OS commands.
 * Routes commands to pure OS commands via runOS.
 */

import { useCommandListener } from '../../../command/hooks/useCommandListener';
import { OS_COMMANDS, type OSNavigatePayload } from '../../../command/definitions/commandsShell';
import { NAVIGATE, TAB, SELECT, ACTIVATE, FOCUS, DISMISS } from './commands';
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
                runOS(SELECT, (payload ?? {}) as { targetId?: string; zoneId?: string });
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
    ]);

    return null;
}

FocusIntent.displayName = 'FocusIntent';
