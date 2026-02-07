import type { BaseCommand } from "@os/entities/BaseCommand";
import { create } from "zustand";

type CommandHandler = (cmd: BaseCommand) => void;

interface CommandEventBusState {
  /** Internal Set of listeners */
  _listeners: Set<CommandHandler>;
  /** Add a listener */
  addListener: (handler: CommandHandler) => void;
  /** Remove a listener */
  removeListener: (handler: CommandHandler) => void;
  /** Emit a command to all listeners */
  emit: (cmd: BaseCommand) => void;
}

/**
 * Command Event Bus:
 *
 * A lightweight pub/sub system for command notifications.
 * Components can subscribe to receive all dispatched commands
 * for component-level reactions (e.g., Field's isEditing state).
 *
 * This runs BEFORE the command handler executes, allowing
 * components to intercept and react to commands independently
 * of the global state.
 */
export const useCommandEventBus = create<CommandEventBusState>((set, get) => ({
  _listeners: new Set(),

  addListener: (handler) => {
    set((state) => {
      const newListeners = new Set(state._listeners);
      newListeners.add(handler);
      return { _listeners: newListeners };
    });
  },

  removeListener: (handler) => {
    set((state) => {
      const newListeners = new Set(state._listeners);
      newListeners.delete(handler);
      return { _listeners: newListeners };
    });
  },

  emit: (cmd) => {
    const { _listeners } = get();
    // console.debug("[EventBus] emit:", cmd.type, "listeners:", _listeners.size);
    _listeners.forEach((listener) => {
      try {
        listener(cmd);
      } catch (e) {
        console.error("[CommandEventBus] Listener error:", e);
      }
    });
  },
}));
