import { useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { CommandContext, FocusContext } from '../CommandContext';
import type { BaseCommand } from '../types';

export interface FocusZoneProps {
    id: string;
    children: ReactNode;
    dispatch?: (cmd: BaseCommand) => void;
    currentFocusId?: string | null;
    defaultFocusId?: string;
    registry?: any;
}

export function FocusZone({ id, children, dispatch: customDispatch, currentFocusId: customFocusId, defaultFocusId, registry: customRegistry }: FocusZoneProps) {
    const { dispatch: contextDispatch, currentFocusId: contextFocusId, activeZone, registry: contextRegistry } = useContext(CommandContext);
    const dispatch = customDispatch || contextDispatch;
    const currentFocusId = customFocusId !== undefined ? customFocusId : contextFocusId;
    const registry = customRegistry || contextRegistry;

    const isActive = activeZone ? activeZone === id : (String(currentFocusId).startsWith(id) || currentFocusId === id);

    // --- Dynamic Keybinding Lifecycle ---
    // This is the core magic: keys are only active if THIS zone is active
    useEffect(() => {
        if (isActive && registry && typeof registry.getKeybindings === 'function') {
            const bindings = registry.getKeybindings();
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.defaultPrevented) return; // Respect handled events (like Input Enter)
                const match = bindings.find((b: { key: string }) => b.key.toLowerCase() === e.key.toLowerCase());
                if (match) {
                    e.preventDefault();
                    dispatch({ type: match.command, payload: match.args });
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isActive, registry, dispatch]);

    const handleFocus = (e: React.FocusEvent) => {
        if (e.target === e.currentTarget && defaultFocusId && currentFocusId === null) {
            dispatch({ type: 'SET_FOCUS', payload: { id: defaultFocusId } });
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        // If clicking on the zone background or children when not active, reclaim focus
        if (!isActive && defaultFocusId) {
            dispatch({ type: 'SET_FOCUS', payload: { id: defaultFocusId } });
        }
    };

    return (
        <FocusContext.Provider value={{ zoneId: id, isActive }}>
            <div
                data-zone-id={id}
                data-active={isActive}
                onFocus={handleFocus}
                onClick={handleClick}
                tabIndex={-1}
                className="outline-none transition-all duration-700 h-full flex flex-col data-[active=false]:grayscale data-[active=false]:opacity-30 data-[active=false]:scale-[0.98] data-[active=false]:blur-[0.5px] data-[active=true]:grayscale-0 data-[active=true]:opacity-100 data-[active=true]:scale-100"
                style={{ flex: id === 'sidebar' ? 'none' : '1' }}
            >
                {children}
            </div>
        </FocusContext.Provider>
    );
}
