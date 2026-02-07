/**
 * TestBot — Constants & Shared Helpers
 */

export const KEY_LABELS: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Tab: "⇥ Tab",
  Enter: "↵ Enter",
  Escape: "Esc",
  " ": "Space",
  Backspace: "⌫",
  Delete: "Del",
};

export class BotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BotError";
  }
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function getElementCenter(el: Element) {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
