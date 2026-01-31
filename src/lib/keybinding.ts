import { useEffect, useMemo } from 'react';
import { useContextService, compileWhen } from './context';
import type { ContextState } from './context';
import type { BaseCommand } from './primitives';
import { logger } from './logger';

export interface KeybindingItem {
    key: string;
    command: string;
    args?: any;
    when?: string;
    preventDefault?: boolean;
}

// Runtime Optimization provided by the new architecture
interface CompiledKeybinding extends KeybindingItem {
    matches: (context: ContextState) => boolean;
}

/**
 * Keybinding Resolver Engine (Optimized)
 */
function resolveKeybinding(
    e: KeyboardEvent,
    bindings: CompiledKeybinding[],
    context: ContextState
): KeybindingItem | null {
    const candidates = bindings.filter(b => b.key === e.key);

    // O(1) lookup per candidate using pre-compiled matcher
    for (const candidate of candidates) {
        if (candidate.matches(context)) {
            logger.debug('KEYMAP', `Shortcut Match: [${e.key}] -> ${candidate.command}`, { when: candidate.when });
            return candidate;
        }
    }

    return null;
}

/**
 * useKeybindingRegistry: Optimized with LayoutEffect and Compilation
 */
export function useKeybindingRegistry(
    dispatch: (cmd: BaseCommand) => void,
    registry: KeybindingItem[],
    enabled: boolean = true
) {
    const { context } = useContextService();

    // 1. Compile 'when' clauses ONCE when registry changes.
    // This turns string parsing into function calls.
    const compiledRegistry = useMemo(() => {
        return registry.map(item => ({
            ...item,
            matches: compileWhen(item.when)
        }));
    }, [registry]);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Use the compiled registry for fast lookups
            const match = resolveKeybinding(e, compiledRegistry, context);

            if (match) {
                if (match.preventDefault !== false) {
                    e.preventDefault();
                }

                const command: BaseCommand = {
                    type: match.command,
                    payload: match.args
                };

                dispatch(command);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch, compiledRegistry, context, enabled]);
}
