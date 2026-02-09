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

import type { Command } from "@kernel";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface KeyBinding {
  /** Canonical key string (e.g. "ArrowDown", "Meta+K", "Shift+Tab") */
  key: string;

  /** Factory that produces a kernel Command */
  command: (...args: any[]) => Command<string, any>;

  /** Static args passed to the factory (spread as arguments) */
  args?: any[];

  /** Context guard: when should this binding be active? */
  when?: "editing" | "navigating";
}

export interface KeyResolveContext {
  /** Whether a Field is currently being edited */
  isEditing: boolean;
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

    // Priority: context-specific bindings first, then universal
    for (const b of list) {
      if (b.when === "editing" && context.isEditing) return b;
      if (b.when === "navigating" && !context.isEditing) return b;
    }

    // Fallback: universal (no `when`)
    for (const b of list) {
      if (!b.when) return b;
    }

    return null;
  },

  /**
   * Check if any keybinding exists for a canonical key.
   */
  has(key: string): boolean {
    return bindings.has(key) && bindings.get(key)?.length > 0;
  },

  /** Clear all bindings (for testing). */
  clear(): void {
    bindings.clear();
  },
};
