/**
 * Keybindings — Key→command resolution registry.
 *
 * Factory-based: each createKeybindingRegistry() returns an independent instance.
 * Production uses the default instance. Tests can create fresh instances.
 *
 * The registry is context-aware:
 *   - `when: "navigating"` — only active when not editing a Field
 *   - `when: "editing"`    — only active when editing a Field
 *   - `when: undefined`    — always active
 */

import type { BaseCommand } from "@kernel";
import type { ZoneCallback } from "@os-core/engine/registries/zoneRegistry";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface KeyBinding {
  /** Canonical key string (e.g. "ArrowDown", "Meta+K", "Shift+Tab") */
  key: string;

  /** Command or callback. OS defaults: BaseCommand. App custom: ZoneCallback */
  command: BaseCommand | ZoneCallback;

  /** Context guard: when should this binding be active? */
  when?: "editing" | "navigating";
}

export interface KeyResolveContext {
  /** Whether the target element is an editable element (input/textarea/contentEditable) */
  isEditing: boolean;
  /**
   * Whether the field actively consumes this specific key.
   * When false AND isEditing is true, the key is "released" to OS navigation.
   * This enables inline fields (draft, search) to let Tab/ArrowDown through.
   * Defaults to isEditing if not provided (backward compatibility).
   */
  isFieldActive?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Registry Interface
// ═══════════════════════════════════════════════════════════════════

export interface KeybindingRegistry {
  register(binding: KeyBinding): () => void;
  registerAll(items: KeyBinding[]): () => void;
  resolve(key: string, context: KeyResolveContext): KeyBinding | null;
  has(key: string): boolean;
  clear(): void;
}

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export function createKeybindingRegistry(): KeybindingRegistry {
  const bindings = new Map<string, KeyBinding[]>();

  const registry: KeybindingRegistry = {
    register(binding: KeyBinding): () => void {
      const list = bindings.get(binding.key) ?? [];
      list.push(binding);
      bindings.set(binding.key, list);

      return () => {
        const l = bindings.get(binding.key);
        if (!l) return;
        const idx = l.indexOf(binding);
        if (idx !== -1) l.splice(idx, 1);
        if (l.length === 0) bindings.delete(binding.key);
      };
    },

    registerAll(items: KeyBinding[]): () => void {
      const unregisters = items.map((b) => registry.register(b));
      return () => {
        for (const fn of unregisters) fn();
      };
    },

    resolve(key: string, context: KeyResolveContext): KeyBinding | null {
      const list = bindings.get(key);
      if (!list || list.length === 0) return null;

      const fieldActive = context.isFieldActive ?? context.isEditing;

      // Later-wins: iterate in reverse so app bindings shadow OS defaults.
      // Pass 1: "editing" — highest priority when isEditing + field delegates this key
      if (context.isEditing && !fieldActive) {
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i]!.when === "editing") return list[i]!;
        }
      }

      // Pass 2: "navigating" — field does NOT consume this key
      if (!fieldActive) {
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i]!.when === "navigating") return list[i]!;
        }
      }

      // Pass 3: universal (no `when`) — always active
      for (let i = list.length - 1; i >= 0; i--) {
        if (!list[i]!.when) return list[i]!;
      }

      return null;
    },

    has(key: string): boolean {
      return bindings.has(key) && (bindings.get(key)?.length ?? 0) > 0;
    },

    clear(): void {
      bindings.clear();
    },
  };

  return registry;
}

// ═══════════════════════════════════════════════════════════════════
// Default instance — production singleton (backward compat)
// ═══════════════════════════════════════════════════════════════════

export const Keybindings = createKeybindingRegistry();
