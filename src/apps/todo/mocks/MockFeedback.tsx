import React from "react";
import {
  Loader2,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  MousePointer2,
} from "lucide-react";

// --- MockSpinner ---

export interface MockSpinnerProps {
  size?: number;
  className?: string;
}

export const MockSpinner: React.FC<MockSpinnerProps> = ({
  size = 20,
  className,
}) => {
  return (
    <Loader2
      size={size}
      className={`animate-spin text-indigo-500 ${className || ""}`}
      data-testid="mock-spinner"
    />
  );
};

// --- MockToast ---

export interface MockToastProps {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  visible?: boolean;
  className?: string;
}

export const MockToast: React.FC<MockToastProps> = ({
  message,
  type = "info",
  visible = true,
  className,
}) => {
  if (!visible) return null;

  const styles = {
    info: "bg-slate-800 border-slate-700 text-slate-200",
    success: "bg-green-500/10 border-green-500/20 text-green-400",
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
    error: "bg-red-500/10 border-red-500/20 text-red-400",
  };

  const icons = {
    info: <Info size={16} />,
    success: <CheckCircle size={16} />,
    warning: <AlertTriangle size={16} />,
    error: <AlertCircle size={16} />,
  };

  return (
    <div
      className={`
        fixed bottom-8 right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in
        ${styles[type]}
        ${className || ""}
      `}
      data-testid="mock-toast"
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// --- MockCursor ---

export interface MockCursorProps {
  x: number;
  y: number;
  color?: string;
  label?: string;
  className?: string;
}

export const MockCursor: React.FC<MockCursorProps> = ({
  x,
  y,
  color = "#6366f1", // Indigo-500
  label,
  className,
}) => {
  return (
    <div
      className={`fixed pointer-events-none z-[100] transition-all duration-100 ease-out ${className || ""}`}
      style={{ left: x, top: y }}
      data-testid="mock-cursor"
    >
      <MousePointer2
        size={24}
        fill={color}
        color="white"
        className="transform -translate-x-[5px] -translate-y-[2px]"
      />
      {label && (
        <div
          className="absolute left-4 top-4 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm whitespace-nowrap"
          style={{ backgroundColor: color }}
        >
          {label}
        </div>
      )}
    </div>
  );
};
