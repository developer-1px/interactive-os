import { memo } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging tailwind classes safely
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface KbdProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'active' | 'outline' | 'ghost';
    size?: 'xs' | 'sm' | 'md';
}

export const Kbd = memo(({ children, className, variant = 'default', size = 'sm' }: KbdProps) => {
    const baseStyles = "inline-flex items-center justify-center rounded font-mono font-black border select-none transition-all duration-200";

    const variants = {
        default: "bg-black/40 border-white/10 text-slate-400 shadow-sm",
        active: "border-indigo-500 text-indigo-400 bg-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.4)]",
        outline: "bg-transparent border-white/20 text-slate-300",
        ghost: "bg-white/5 border-transparent text-slate-400 hover:bg-white/10",
    };

    const sizes = {
        xs: "min-w-[16px] h-4 px-1 text-[8px]",  // Matches CommandInspector compact style
        sm: "min-w-[20px] h-5 px-1.5 text-[10px]", // Matches Sidebar/General UI
        md: "min-w-[24px] h-6 px-2 text-xs",
    };

    return (
        <kbd className={cn(baseStyles, variants[variant], sizes[size], className)}>
            {children}
        </kbd>
    );
});
