import React from "react";
import * as LucideIcons from "lucide-react";

// --- MockIcon ---

export interface MockIconProps {
  name: string;
  size?: number | string;
  color?: string;
  className?: string;
}

export const MockIcon: React.FC<MockIconProps> = ({
  name,
  size = 24,
  color = "currentColor",
  className,
}) => {
  // In a real mock, we might just render a placeholder, or try to render the actual icon if feasible.
  // For "Mock" purposes defined in docs (verify existence), a consistently styled placeholder is often best.
  // However, mapping to Lucide is useful for visual debugging.

  // Safe access to icons
  const IconComponent =
    (LucideIcons as any)[name] || (LucideIcons as any)["HelpCircle"];

  return (
    <div
      className={`inline-flex items-center justify-center ${className || ""}`}
      style={{ color: color, width: size, height: size }}
      data-testid={`mock-icon-${name}`}
      aria-hidden="true"
    >
      {IconComponent ? (
        <IconComponent size={size} color={color} />
      ) : (
        <span>?</span>
      )}
    </div>
  );
};

// --- MockText ---

export interface MockTextProps {
  variant?: "h1" | "h2" | "body" | "caption";
  color?: string;
  weight?: "normal" | "medium" | "bold";
  children: React.ReactNode;
  className?: string;
}

export const MockText: React.FC<MockTextProps> = ({
  variant = "body",
  color,
  weight = "normal",
  children,
  className,
}) => {
  const baseStyle = "font-sans transition-colors";

  const variants = {
    h1: "text-4xl leading-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 font-bold", // Matching TodoPanel aesthetic
    h2: "text-2xl font-light tracking-tight",
    body: "text-base text-slate-200",
    caption: "text-xs text-slate-500 font-mono",
  };

  const weights = {
    normal: "font-normal",
    medium: "font-medium",
    bold: "font-bold",
  };

  const ComputedComponent =
    variant === "h1" ? "h1" : variant === "h2" ? "h2" : "p";
  const customColorStyle = color ? { color } : {};

  return (
    <ComputedComponent
      className={`${baseStyle} ${variants[variant]} ${weights[weight]} ${className || ""}`}
      style={customColorStyle}
      data-testid={`mock-text-${variant}`}
    >
      {children}
    </ComputedComponent>
  );
};

// --- MockBadge ---

export interface MockBadgeProps {
  label: string | number;
  color?: "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

export const MockBadge: React.FC<MockBadgeProps> = ({
  label,
  color = "neutral",
  size = "md",
  className,
}) => {
  const colorStyles = {
    success: "bg-green-500/10 text-green-400 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border border-opacity-50 font-mono font-medium ${colorStyles[color]} ${sizeStyles[size]} ${className || ""}`}
      data-testid={`mock-badge-${label}`}
    >
      {label}
    </span>
  );
};

// --- MockShortcut ---

export interface MockShortcutProps {
  keys: string[];
  className?: string;
}

export const MockShortcut: React.FC<MockShortcutProps> = ({
  keys,
  className,
}) => {
  return (
    <div
      className={`flex items-center gap-1 ${className || ""}`}
      data-testid="mock-shortcut"
    >
      {keys.map((k, i) => (
        <React.Fragment key={i}>
          <kbd className="min-h-[20px] inline-flex items-center justify-center rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-400 shadow-[0_2px_0_0_rgba(0,0,0,0.2)]">
            {k}
          </kbd>
          {i < keys.length - 1 && (
            <span className="text-slate-600 text-[10px]">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
