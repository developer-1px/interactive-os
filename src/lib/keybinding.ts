import type { LogicNode } from "./logic/builder";

export interface KeybindingItem<T = string> {
  key: string;
  command: T;
  args?: any;
  when?: string | LogicNode;
  preventDefault?: boolean;
  allowInInput?: boolean;
}

export interface KeymapConfig<T = string> {
  global?: KeybindingItem<T>[];
  zones?: Record<string, KeybindingItem<T>[]>;
}

/**
 * Normalizes a keyboard event into a canonical string format matching our definitions.
 * Format: [Meta+][Ctrl+][Alt+][Shift+]Key
 * Example: "Meta+ArrowUp", "Shift+Enter", "k"
 */
export function getCanonicalKey(e: KeyboardEvent): string {
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
