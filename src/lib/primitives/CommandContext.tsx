import { createContext } from 'react';


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
}

export const CommandContext = createContext<CommandContextValue>({
    dispatch: () => { },
    currentFocusId: null,
    activeZone: undefined
});
