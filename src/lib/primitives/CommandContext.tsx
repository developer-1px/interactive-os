import { createContext, useContext } from 'react';


// --- 0. Context for Focus Zones ---
export interface FocusContextValue {
    zoneId: string;
    isActive: boolean;
}
export const FocusContext = createContext<FocusContextValue | null>(null);

export interface CommandContextValue {
    dispatch: (cmd: any) => void;
    currentFocusId?: any;
    activeZone?: string | null;
    registry?: any;
    ctx?: any;
}

export const CommandContext = createContext<CommandContextValue | null>(null);

// --- Bridge Pattern for Provider-less Usage ---
let globalEngineHelper: (() => CommandContextValue) | null = null;

export const setGlobalEngine = (hook: () => CommandContextValue) => {
    globalEngineHelper = hook;
};

export const useCommandEngine = () => {
    const context = useContext(CommandContext);
    if (context) return context;

    if (globalEngineHelper) {
        return globalEngineHelper();
    }

    throw new Error('Command Engine not initialized. Wrap in Provider or call setGlobalEngine().');
};
