import type { CommandFactory } from "@os/entities/CommandFactory";

/**
 * Global static registry for Group-based command discovery.
 * This allows commands to be defined in modules and automatically discovered entirely by their Group ID,
 * without needing to pass them as props to the FocusGroup component.
 */
const groupCommandMap = new Map<string, CommandFactory<any, any>[]>();

export const GroupRegistry = {
  register: (groupId: string, factory: CommandFactory<any, any>) => {
    const hidden = groupCommandMap.get(groupId) || [];
    // Prevent duplicates (HMR safety)
    if (!hidden.find((c) => c.id === factory.id)) {
      hidden.push(factory);
      groupCommandMap.set(groupId, hidden);
    }
  },

  getCommands: (groupId: string) => {
    return groupCommandMap.get(groupId) || [];
  },

  getAll: () => {
    return new Map(groupCommandMap);
  },

  get: (groupId: string, commandId: string) => {
    const commands = groupCommandMap.get(groupId);
    return commands?.find((c) => c.id === commandId);
  },
};
