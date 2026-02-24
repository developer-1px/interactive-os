/**
 * Keybindings — Flat key→command lookup registry.
 *
 * OS ships defaults (arrow keys, enter, space, tab, escape).
 * Apps can register/unregister additional bindings at runtime.
 *
 * The registry is context-aware:
 *   - `when: "navigating"` — only active when not editing a Field
 *   - `when: "editing"`    — only active when editing a Field
 *   - `when: undefined`    — always active
 */

import type { BaseCommand } from "@kernel";
import type { ZoneCallback } from "@os/2-contexts/zoneRegistry";

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
// Registry
// ═══════════════════════════════════════════════════════════════════

const bindings = new Map<string, KeyBinding[]>();

export const Keybindings = {
  /**
   * Register a keybinding. Returns an unregister function.
   */
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

  /**
   * Register multiple keybindings at once. Returns a single unregister function.
   */
  registerAll(items: KeyBinding[]): () => void {
    const unregisters = items.map((b) => Keybindings.register(b));
    return () => {
      for (const fn of unregisters) fn();
    };
  },

  /**
   * Resolve the best matching binding for a canonical key + context.
   */
  resolve(key: string, context: KeyResolveContext): KeyBinding | null {
    const list = bindings.get(key);
    if (!list || list.length === 0) return null;

    // isFieldActive: does the field consume this specific key?
    // Falls back to isEditing for backward compatibility.
    const fieldActive = context.isFieldActive ?? context.isEditing;

    // Pass 1: "editing" — highest priority when isEditing + field delegates this key
    if (context.isEditing && !fieldActive) {
      for (const b of list) {
        if (b.when === "editing") return b;
      }
    }

    // Pass 2: "navigating" — field does NOT consume this key
    if (!fieldActive) {
      for (const b of list) {
        if (b.when === "navigating") return b;
      }
    }

    // Pass 3: universal (no `when`) — always active
    for (const b of list) {
      if (!b.when) return b;
    }

    return null;
  },

  /**
   * Check if any keybinding exists for a canonical key.
   */
  has(key: string): boolean {
    return bindings.has(key) && (bindings.get(key)?.length ?? 0) > 0;
  },

  /** Clear all bindings (for testing). */
  clear(): void {
    bindings.clear();
  },
};
