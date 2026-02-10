import type { CommandDefinition } from "@os/entities/CommandDefinition";
import type { KeymapConfig } from "@/os-new/lib/getCanonicalKey.ts";
import { logger } from "@/os-new/lib/logger";
import type { KeybindingItem } from "@/os-new/schema/keyboard/KeybindingItem";

export interface CommandGroup<S, P = unknown, K extends string = string> {
  id: string;
  when?: string;
  commands: CommandDefinition<S, P, K>[];
}

/** Flatten keymap config into a single array of bindings */
// T can be string (ID) or CommandFactory (Object)
function flattenKeymap<T>(
  keymap: KeybindingItem<T>[] | KeymapConfig<T>,
): KeybindingItem<T>[] {
  if (Array.isArray(keymap)) return keymap;

  const result: KeybindingItem<T>[] = [];
  if (keymap.global) result.push(...keymap.global);
  if (keymap.zones) {
    Object.entries(keymap.zones).forEach(([zoneId, bindings]) => {
      // Set both zoneId and groupId (aliases) for compatibility with resolveKeybinding
      (bindings as KeybindingItem<T>[]).forEach((b) => {
        result.push({ ...b, zoneId, groupId: zoneId });
      });
    });
  }
  return result;
}

export class CommandRegistry<S, K extends string = string> {
  // Store commands with unknown payload type since execution handles diverse payloads
  private commands: Map<K, CommandDefinition<S, unknown, K>> = new Map();

  // Keymap binding command type can be K (string ID) or Command Object
  private keymap: KeybindingItem<any>[] | KeymapConfig<any> = [];

  register(definition: CommandDefinition<S, any, K>) {
    this.commands.set(
      definition.id,
      definition as CommandDefinition<S, unknown, K>,
    );
  }

  registerGroup(group: CommandGroup<S, any, K>) {
    group.commands.forEach((cmd) => {
      const combinedWhen = group.when
        ? cmd.when
          ? `(${group.when}) && (${cmd.when})`
          : group.when
        : cmd.when;
      this.register({
        ...cmd,
        ...(combinedWhen !== undefined ? { when: combinedWhen } : {}),
      });
    });
  }

  setKeymap(keymap: KeybindingItem<any>[] | KeymapConfig<any>) {
    this.keymap = keymap;

    // Auto-register commands from keymap
    let autoRegistered = 0;
    flattenKeymap(keymap).forEach((binding) => {
      const cmd = binding.command;
      // Duck typing check for Command Object
      if (cmd && typeof cmd === "function" && "id" in cmd && "run" in cmd) {
        const def = cmd as unknown as CommandDefinition<S, unknown, K>;
        if (!this.commands.has(def.id)) {
          this.register(def);
          autoRegistered++;
        }
      }
    });

    logger.debug(
      "SYSTEM",
      `Keymap loaded: ${flattenKeymap(keymap).length} bindings (${autoRegistered} auto-discovered)`,
    );
  }

  get(id: K): CommandDefinition<S, unknown, K> | undefined {
    return this.commands.get(id);
  }

  getAll(): CommandDefinition<S, unknown, K>[] {
    return Array.from(this.commands.values());
  }

  getKeybindings(): KeybindingItem<any>[] {
    return flattenKeymap(this.keymap).map((binding) => {
      // Resolve Command ID from potentially Object-based command in binding
      let commandId: any = binding.command;

      if (typeof binding.command === "function" && "id" in binding.command) {
        commandId = (binding.command as any).id;
      } else if (
        typeof binding.command === "object" &&
        binding.command &&
        "id" in binding.command
      ) {
        commandId = (binding.command as any).id;
      }

      const cmd = this.get(commandId as K);
      const resolvedWhen = binding.when || cmd?.when;
      return {
        ...binding,
        command: commandId,
        ...(resolvedWhen !== undefined ? { when: resolvedWhen } : {}),
        args: binding.args,
        ...(binding.allowInInput !== undefined ? { allowInInput: binding.allowInInput } : {}),
      };
    });
  }
}
