import type { KeybindingItem } from "../../schema/keyboard/KeybindingItem.ts";

export interface KeymapConfig<T = string> {
  global?: KeybindingItem<T>[];
  zones?: Record<string, KeybindingItem<T>[]>;
}

// macOS platform detection (evaluated once)
const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform);

// macOS: Cmd+Arrow → Home/End normalization map
// Mac keyboards lack physical Home/End keys, so Cmd+↑/↓ is the platform convention.
const MAC_KEY_NORMALIZATION: Record<string, string> = {
  "Meta+ArrowUp": "Home",
  "Meta+ArrowDown": "End",
};

/**
 * Normalizes a keyboard event into a canonical string format matching our definitions.
 * Format: [Meta+][Ctrl+][Alt+][Shift+]Key
 * Example: "Meta+ArrowUp", "Shift+Enter", "k"
 *
 * macOS normalization: Cmd+↑/↓ → Home/End (platform convention).
 * This allows downstream pipeline to treat Home/End uniformly across platforms.
 */
export function getCanonicalKey(e: KeyboardEvent): string {
  // ── macOS: Normalize Cmd+Arrow → Home/End ──
  // Must run before modifier extraction to strip Meta from the result.
  if (isMac && e.metaKey && !e.ctrlKey && !e.altKey) {
    const rawKey =
      e.key === "ArrowUp" || e.key === "ArrowDown" ? `Meta+${e.key}` : null;
    if (rawKey && MAC_KEY_NORMALIZATION[rawKey]) {
      const normalized = MAC_KEY_NORMALIZATION[rawKey];
      // Preserve Shift for range selection (Cmd+Shift+↑ → Shift+Home)
      return e.shiftKey ? `Shift+${normalized}` : normalized;
    }
  }

  const modifiers: string[] = [];

  // Strict Modifier Order: Meta -> Ctrl -> Alt -> Shift
  if (e.metaKey) modifiers.push("Meta");
  if (e.ctrlKey) modifiers.push("Ctrl");
  if (e.altKey) modifiers.push("Alt");
  if (e.shiftKey) modifiers.push("Shift");

  let key = e.key;

  // Normalization for consistency
  if (key === " ") key = "Space";
  if (key === "Escape") key = "Escape"; // consistent case

  // If the key is a modifier itself (e.g. user just pressed "Shift"),
  // we don't want "Shift+Shift".
  if (["Meta", "Control", "Alt", "Shift"].includes(key)) {
    return key;
  }

  // Capitalize single letters to match "Cmd+K" style usually used in configs
  if (key.length === 1) {
    key = key.toUpperCase();
  }

  // Join with '+'
  return modifiers.length > 0 ? `${modifiers.join("+")}+${key}` : key;
}

/**
 * Normalizes a definition string to ensure it matches the event canonical form.
 * Useful if we have loose definitions like "ctrl+c" vs "Ctrl+C".
 */
export function normalizeKeyDefinition(keyDef: string): string {
  const parts = keyDef.split("+").map((p) => {
    const clean = p.trim();
    if (clean === " ") return "Space";
    // Capitalize first letter of modifiers, or whole key if single char
    if (
      ["meta", "ctrl", "alt", "shift", "cmd", "command", "control"].includes(
        clean.toLowerCase(),
      )
    ) {
      if (clean.toLowerCase() === "cmd" || clean.toLowerCase() === "command")
        return "Meta";
      if (clean.toLowerCase() === "control") return "Ctrl";
      return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    }
    return clean.length === 1 ? clean.toUpperCase() : clean;
  });

  // Re-sort modifiers
  const textPart = parts.pop()!;
  const modifiers = parts.sort((a, b) => {
    const order = ["Meta", "Ctrl", "Alt", "Shift"];
    return order.indexOf(a) - order.indexOf(b);
  });

  return modifiers.length > 0 ? `${modifiers.join("+")}+${textPart}` : textPart;
}
