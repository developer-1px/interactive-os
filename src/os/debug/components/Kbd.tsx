import { memo } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useOS, type OS } from "@/lib/hooks/use-os";

// Utility for merging tailwind classes safely
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface KbdProps {
  children?: React.ReactNode;
  keys?: string[]; // Array of keys to render, e.g. ["Meta", "Shift", "K"]
  className?: string;
  variant?: "default" | "active" | "outline" | "ghost";
  size?: "xs" | "sm" | "md";
}

const SYMBOLS: Record<OS, Record<string, string>> = {
  mac: {
    Meta: "⌘",
    Shift: "⇧",
    Alt: "⌥",
    Control: "⌃",
    Enter: "↵",
    Backspace: "⌫",
    Delete: "⌦",
    Escape: "⎋",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Tab: "⇥",
  },
  windows: {
    Meta: "Win",
    Shift: "Shift",
    Alt: "Alt",
    Control: "Ctrl",
    Enter: "Enter",
    Backspace: "Backspace",
    Delete: "Del",
    Escape: "Esc",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Tab: "Tab",
  },
  linux: {
    Meta: "Super",
    Shift: "Shift",
    Alt: "Alt",
    Control: "Ctrl",
    Enter: "Enter",
    Backspace: "Backspace",
    Delete: "Del",
    Escape: "Esc",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Tab: "Tab",
  },
  other: {
    Meta: "Meta",
    Shift: "Shift",
    Alt: "Alt",
    Control: "Ctrl",
    Enter: "Enter",
    Backspace: "Backspace",
    Delete: "Del",
    Escape: "Esc",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Tab: "Tab",
  },
};

export const Kbd = memo(
  ({ children, keys, className, variant = "default", size = "sm" }: KbdProps) => {
    const os = useOS();
    const baseStyles =
      "inline-flex items-center justify-center rounded font-mono font-black border select-none transition-all duration-200 shrink-0";

    const variants = {
      default: "bg-black/40 border-white/10 text-slate-400 shadow-sm",
      active:
        "border-indigo-500 text-indigo-400 bg-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.4)]",
      outline: "bg-transparent border-white/20 text-slate-300",
      ghost: "bg-white/5 border-transparent text-slate-400 hover:bg-white/10",
    };

    const sizes = {
      xs: "min-w-[16px] h-4 px-1 text-[8px] gap-0.5", // Matches CommandInspector compact style
      sm: "min-w-[20px] h-5 px-1.5 text-[10px] gap-1", // Matches Sidebar/General UI
      md: "min-w-[24px] h-6 px-2 text-xs gap-1.5",
    };

    const renderKey = (key: string) => {
      // If it's a known symbol for the OS, use it. Otherwise use the key itself.
      // We also check if the key in lowercase matches a known key for robustness
      const normalizedKey = key.trim();
      // Capitalize first letter for lookup if needed
      const lookupKey = normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1);

      return SYMBOLS[os][lookupKey] || (SYMBOLS[os][key] ? SYMBOLS[os][key] : key);
    };

    // If 'keys' prop is provided, render mapped keys mapping
    if (keys && keys.length > 0) {
      return (
        <span className={cn("inline-flex items-center gap-1", className)}>
          {keys.map((k, i) => (
            <kbd
              key={i}
              className={cn(baseStyles, variants[variant], sizes[size])}
            >
              {renderKey(k)}
            </kbd>
          ))}
        </span>
      );
    }

    // Fallback: render children directly if no keys array provided
    // If child is a string and looks like it might be a key name, we could try to map it,
    // but for safety, let's just render what is passed unless it's strictly a string child
    let content = children;
    if (typeof children === 'string') {
      content = renderKey(children);
    }

    return (
      <kbd
        className={cn(baseStyles, variants[variant], sizes[size], className)}
      >
        {content}
      </kbd>
    );
  },
);
