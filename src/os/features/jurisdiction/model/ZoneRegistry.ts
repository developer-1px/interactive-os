import type { CommandFactory } from "@os/entities/CommandFactory";

/**
 * Global static registry for Zone-based command discovery.
 * This allows commands to be defined in modules and automatically discovered entirely by their Zone ID,
 * without needing to pass them as props to the Zone component.
 */
const zoneCommandMap = new Map<string, CommandFactory<any, any>[]>();

export const ZoneRegistry = {
    register: (zoneId: string, factory: CommandFactory<any, any>) => {
        const hidden = zoneCommandMap.get(zoneId) || [];
        // Prevent duplicates (HMR safety)
        if (!hidden.find((c) => c.id === factory.id)) {
            hidden.push(factory);
            zoneCommandMap.set(zoneId, hidden);
        }
    },

    getCommands: (zoneId: string) => {
        return zoneCommandMap.get(zoneId) || [];
    },

    getAll: () => {
        return new Map(zoneCommandMap);
    },
};
