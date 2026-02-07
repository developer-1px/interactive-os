import { memo } from "react";

// Helper to format keys into icons/symbols
const formatKeySymbol = (keyStr: string) => {
  return keyStr
    .split("+")
    .map((part) => {
      const lower = part.toLowerCase().trim();
      switch (lower) {
        case "meta":
        case "cmd":
        case "command":
          return "⌘";
        case "shift":
          return "⇧";
        case "alt":
        case "opt":
        case "option":
          return "⌥";
        case "ctrl":
        case "control":
          return "⌃";
        case "arrowup":
        case "up":
          return "↑";
        case "arrowdown":
        case "down":
          return "↓";
        case "arrowleft":
        case "left":
          return "←";
        case "arrowright":
        case "right":
          return "→";
        case "enter":
        case "return":
          return "↵";
        case "backspace":
        case "delete":
          return "⌫";
        case "esc":
        case "escape":
          return "⎋";
        case "tab":
          return "⇥";
        case "space":
          return "␣";
        default:
          return part.toUpperCase();
      }
    })
    .join("");
};

interface KbdProps {
  shortcut: string;
  className?: string;
}

export const Kbd = memo(({ shortcut, className = "" }: KbdProps) => {
  return (
    <span className={`font-mono ${className}`}>
      {formatKeySymbol(shortcut)}
    </span>
  );
});
