import React from 'react';
import { X, Minus, Square } from 'lucide-react';

// --- MockWindow ---

export interface MockWindowProps {
    title?: string;
    width?: number | string;
    height?: number | string;
    isActive?: boolean;
    children?: React.ReactNode;
    onClose?: () => void;
    className?: string;
}

export const MockWindow: React.FC<MockWindowProps> = ({
    title = "Untitled",
    width = 600,
    height = 400,
    isActive = true,
    children,
    onClose,
    className
}) => {
    return (
        <div
            className={`
        flex flex-col bg-[#0F1115] border rounded-lg shadow-2xl overflow-hidden transition-all duration-200
        ${isActive ? 'border-indigo-500/30 shadow-indigo-500/10' : 'border-white/5 opacity-80 blur-[1px] grayscale'}
        ${className || ''}
      `}
            style={{ width, height }}
            data-testid="mock-window"
        >
            {/* TitleBar */}
            <div className={`h-10 border-b border-white/5 flex items-center justify-between px-4 select-none ${isActive ? 'bg-white/5' : 'bg-transparent'}`}>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 group">
                        <div onClick={onClose} className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50 hover:bg-red-500 transition-colors flex items-center justify-center cursor-pointer">
                            <X size={8} className="text-black opacity-0 group-hover:opacity-100" />
                        </div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50 hover:bg-yellow-500 transition-colors flex items-center justify-center cursor-pointer">
                            <Minus size={8} className="text-black opacity-0 group-hover:opacity-100" />
                        </div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50 hover:bg-green-500 transition-colors flex items-center justify-center cursor-pointer">
                            <Square size={6} className="text-black opacity-0 group-hover:opacity-100 fill-current" />
                        </div>
                    </div>
                </div>
                <div className="text-xs font-medium text-slate-400">{title}</div>
                <div className="w-12" /> {/* Spacer for centering */}
            </div>

            {/* Content */}
            <div className="flex-1 relative overflow-hidden">
                {children}
            </div>
        </div>
    );
};

// --- MockScrollArea ---

export interface MockScrollAreaProps {
    orientation?: 'vertical' | 'horizontal';
    children: React.ReactNode;
    className?: string;
}

export const MockScrollArea: React.FC<MockScrollAreaProps> = ({
    orientation = 'vertical',
    children,
    className
}) => {
    return (
        <div
            className={`
        relative overflow-auto custom-scrollbar 
        ${orientation === 'vertical' ? 'overflow-y-auto overflow-x-hidden h-full' : 'overflow-x-auto overflow-y-hidden w-full'}
        ${className || ''}
      `}
            data-testid="mock-scroll-area"
        >
            {children}
        </div>
    );
};

// --- MockDivider ---

export interface MockDividerProps {
    orientation?: 'vertical' | 'horizontal';
    thickness?: number;
    className?: string;
    label?: string;
}

export const MockDivider: React.FC<MockDividerProps> = ({
    orientation = 'horizontal',
    thickness = 1,
    className,
    label
}) => {
    if (label && orientation === 'horizontal') {
        return (
            <div className={`flex items-center gap-3 w-full my-4 ${className || ''}`}>
                <div className="h-px bg-white/10 flex-1" style={{ height: thickness }} />
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-500 uppercase tracking-widest font-bold">{label}</span>
                <div className="h-px bg-white/10 flex-1" style={{ height: thickness }} />
            </div>
        )
    }

    return (
        <div
            className={`bg-white/10 ${className || ''}`}
            style={{
                width: orientation === 'vertical' ? thickness : '100%',
                height: orientation === 'horizontal' ? thickness : '100%',
                margin: orientation === 'vertical' ? '0 1rem' : '1rem 0'
            }}
            role="separator"
            data-testid="mock-divider"
        />
    );
};
