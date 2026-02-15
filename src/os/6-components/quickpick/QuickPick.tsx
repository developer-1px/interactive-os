
import React, { useEffect, useRef, useState, useMemo } from "react";
import { kernel } from "@/os/kernel";
import { Dialog } from "../radox/Dialog";
import { FocusGroup, FocusItem } from "../base/FocusGroup";
import { NAVIGATE } from "@/os/3-commands/navigate";
import { OVERLAY_CLOSE, OVERLAY_OPEN } from "@/os/3-commands/overlay";

export interface QuickPickItem {
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
}

export interface QuickPickProps {
    items: QuickPickItem[];
    onSelect: (item: QuickPickItem) => void;
    placeholder?: string;
    isOpen?: boolean;
    onClose?: () => void;
    title?: string;
    className?: string;
}

/**
 * QuickPick — OS Level Primitive
 * 
 * A command palette component that uses:
 * - Overlay system (Dialog)
 * - Virtual Focus (Input stays focused, List items are logically focused)
 * - FocusGroup for keyboard navigation
 */
export function QuickPick({
    items,
    onSelect,
    placeholder = "Type to search...",
    isOpen,
    onClose,
    title,
    className,
}: QuickPickProps) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter items
    const filteredItems = useMemo(() => {
        if (!query) return items;
        const lowerQuery = query.toLowerCase();
        return items.filter(
            (item) =>
                item.label.toLowerCase().includes(lowerQuery) ||
                item.description?.toLowerCase().includes(lowerQuery)
        );
    }, [items, query]);

    // Sync external isOpen state with Kernel Overlay state
    useEffect(() => {
        if (isOpen) {
            kernel.dispatch(OVERLAY_OPEN({ id: "quickpick" }));
        } else {
            kernel.dispatch(OVERLAY_CLOSE({ id: "quickpick" }));
        }
    }, [isOpen]);

    // Detect external close (e.g. Esc handled by DialogZone) to sync back to parent
    const isOverlayOpen = kernel.useComputed(s => s.os.overlays.stack.some(o => o.id === "quickpick"));

    useEffect(() => {
        // If parent thinks it's open, but kernel says closed, notify parent
        if (isOpen && !isOverlayOpen && onClose) {
            onClose();
        }
    }, [isOverlayOpen, isOpen, onClose]);

    // Handle manual close
    const handleClose = () => {
        onClose?.(); // Will trigger effect above to close overlay if needed
        // Or we close overlay directly here to be faster
        kernel.dispatch(OVERLAY_CLOSE({ id: "quickpick" }));
    };

    // Auto-focus input when open
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
        }
    }, [isOpen]);

    // Navigate logic: Input -> List
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            kernel.dispatch(NAVIGATE({ direction: "down" }));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            kernel.dispatch(NAVIGATE({ direction: "up" }));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const state = kernel.getState();
            const zone = state.os.focus.zones["quickpick-list"];
            if (zone?.focusedItemId) {
                const selected = filteredItems.find(i => i.id === zone.focusedItemId);
                if (selected) {
                    onSelect(selected);
                    handleClose();
                }
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            handleClose();
        }
    };

    if (!isOpen) return null;

    // Render Dialog without 'open' prop (controlled by ID)
    return (
        <Dialog id="quickpick">
            <Dialog.Content
                className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col z-50"
            >
                <div className="flex items-center px-4 py-3 border-b border-gray-100">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        className="flex-1 bg-transparent border-none outline-none text-lg text-gray-800 placeholder:text-gray-400"
                        placeholder={placeholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                    />
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2 bg-gray-50/50">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">No results found</div>
                    ) : (
                        <FocusGroup
                            id="quickpick-list"
                            role="listbox"
                            project={{ virtualFocus: true }} // Virtual Focus Enabled
                            navigate={{ orientation: "vertical", loop: true }}
                            className="space-y-1"
                        >
                            {filteredItems.map(item => (
                                <FocusItem
                                    key={item.id}
                                    id={item.id}
                                    role="option"
                                    className="
                                px-4 py-2 rounded-lg flex items-center justify-between text-sm cursor-pointer
                                hover:bg-gray-100 text-gray-700
                                data-[focused=true]:bg-indigo-600 data-[focused=true]:text-white
                                transition-colors
                            "
                                    onClick={() => {
                                        onSelect(item);
                                        handleClose();
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon && <span className="opacity-70">{item.icon}</span>}
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                    {item.description && (
                                        <span className="text-xs opacity-60 ml-4 truncate max-w-[200px]">{item.description}</span>
                                    )}
                                </FocusItem>
                            ))}
                        </FocusGroup>
                    )}
                </div>

                <div className="bg-gray-50 px-4 py-2 text-xs text-gray-400 border-t border-gray-100 flex justify-end gap-3">
                    <span>Scan keys: <kbd className="font-sans border rounded px-1 min-w-[1.2em] inline-block text-center bg-white">↑↓</kbd></span>
                    <span>Select: <kbd className="font-sans border rounded px-1 min-w-[1.2em] inline-block text-center bg-white">↵</kbd></span>
                    <span>Close: <kbd className="font-sans border rounded px-1 min-w-[1.2em] inline-block text-center bg-white">Esc</kbd></span>
                </div>
            </Dialog.Content>
        </Dialog>
    );
}
