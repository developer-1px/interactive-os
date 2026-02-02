import React, { type InputHTMLAttributes, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

// --- MockInput ---

export interface MockInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: boolean;
}

export const MockInput: React.FC<MockInputProps> = ({
    label,
    error,
    className,
    ...props
}) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && <label className="text-xs font-medium text-slate-400">{label}</label>}
            <input
                {...props}
                className={`
          w-full bg-slate-900/50 border rounded-md px-3 py-2 text-sm text-slate-200 
          placeholder:text-slate-600 outline-none transition-all duration-200
          focus:border-indigo-500/50 focus:bg-indigo-500/5 focus:ring-1 focus:ring-indigo-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}
          ${className || ''}
        `}
                data-testid="mock-input"
            />
        </div>
    );
};

// --- MockButton ---

export interface MockButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    intent?: 'primary' | 'secondary' | 'danger' | 'ghost';
    loading?: boolean;
    icon?: React.ReactNode;
}

export const MockButton: React.FC<MockButtonProps> = ({
    children,
    intent = 'primary',
    loading,
    icon,
    className,
    disabled,
    ...props
}) => {
    const baseStyle = "flex items-center justify-center gap-2 rounded-md transition-all duration-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#090A0C] disabled:opacity-50 disabled:pointer-events-none";

    const intents = {
        primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20",
        secondary: "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5",
        danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20",
        ghost: "bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200"
    };

    const sizes = "px-4 py-2"; // Standard size

    return (
        <button
            className={`${baseStyle} ${intents[intent]} ${sizes} ${className || ''}`}
            disabled={disabled || loading}
            data-testid="mock-button"
            {...props}
        >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            {!loading && icon && <span className="w-4 h-4 flex items-center justify-center">{icon}</span>}
            {children}
        </button>
    );
};

// --- MockToggle ---

export interface MockToggleProps {
    checked: boolean;
    onChange?: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export const MockToggle: React.FC<MockToggleProps> = ({
    checked,
    onChange,
    label,
    disabled,
    className
}) => {
    return (
        <label className={`flex items-center gap-3 cursor-pointer group ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className || ''}`}>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange?.(e.target.checked)}
                    disabled={disabled}
                    className="sr-only"
                    data-testid="mock-toggle"
                />
                <div className={`w-10 h-6 rounded-full transition-colors duration-200 border border-transparent ${checked ? 'bg-indigo-600' : 'bg-slate-700'}`}></div>
                <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
            {label && <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>}
        </label>
    );
};
