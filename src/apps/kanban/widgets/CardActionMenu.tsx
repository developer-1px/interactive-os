import { useEngine } from "@os/features/command/ui/CommandContext";
import { CloseActionMenu } from "@apps/kanban/features/commands/menu";
import { SetPriority, DeleteCard } from "@apps/kanban/features/commands/card";
import { ToggleLabel } from "@apps/kanban/features/commands/card";
import { DuplicateCard } from "@apps/kanban/features/commands/clipboard";
import { MoveCardToColumn } from "@apps/kanban/features/commands/card";
import {
    Trash2,
    Copy,
    ArrowRight,
    Flame,
    Tag,
    ChevronRight,
} from "lucide-react";
import type { KanbanState, Priority } from "@apps/kanban/model/appState";
import { useState, useRef, useEffect, useCallback } from "react";

interface MenuItem {
    id: string;
    label: string;
    icon: any;
    action?: () => void;
    danger?: boolean;
    submenu?: SubMenuItem[];
}

interface SubMenuItem {
    id: string;
    label: string;
    color?: string;
    active?: boolean;
    action: () => void;
}

export function CardActionMenu() {
    const { state, dispatch } = useEngine<KanbanState>();
    const [focusedIdx, setFocusedIdx] = useState(0);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
    const [subFocusIdx, setSubFocusIdx] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    const cardId = state?.ui.actionMenuCardId;
    const card = cardId ? state?.data.cards[cardId] : null;

    const close = useCallback(() => dispatch(CloseActionMenu({})), [dispatch]);

    // Build menu items
    const menuItems: MenuItem[] = card ? [
        {
            id: "priority",
            label: "Set Priority",
            icon: Flame,
            submenu: (["urgent", "high", "medium", "low", "none"] as Priority[]).map((p) => ({
                id: p,
                label: p.charAt(0).toUpperCase() + p.slice(1),
                color: p === "urgent" ? "#ef4444" : p === "high" ? "#f97316" : p === "medium" ? "#eab308" : p === "low" ? "#3b82f6" : "#94a3b8",
                active: card.priority === p,
                action: () => { dispatch(SetPriority({ id: card.id, priority: p })); close(); },
            })),
        },
        {
            id: "labels",
            label: "Toggle Label",
            icon: Tag,
            submenu: Object.values(state!.data.labels).map((label) => ({
                id: label.id,
                label: label.name,
                color: label.color,
                active: card.labels.includes(label.id),
                action: () => { dispatch(ToggleLabel({ id: card.id, labelId: label.id })); close(); },
            })),
        },
        {
            id: "move-right",
            label: "Move Right",
            icon: ArrowRight,
            action: () => { dispatch(MoveCardToColumn({ id: card.id, direction: "right" })); close(); },
        },
        {
            id: "duplicate",
            label: "Duplicate",
            icon: Copy,
            action: () => { dispatch(DuplicateCard({ id: card.id })); close(); },
        },
        {
            id: "delete",
            label: "Delete",
            icon: Trash2,
            danger: true,
            action: () => { dispatch(DeleteCard({ id: card.id })); close(); },
        },
    ] : [];

    // Keyboard navigation
    useEffect(() => {
        if (!cardId) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (openSubmenu) {
                const sub = menuItems.find((m) => m.id === openSubmenu)?.submenu;
                if (!sub) return;
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSubFocusIdx((i) => Math.min(i + 1, sub.length - 1));
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSubFocusIdx((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter") {
                    e.preventDefault();
                    sub[subFocusIdx]?.action();
                } else if (e.key === "Escape" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    setOpenSubmenu(null);
                }
                return;
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setFocusedIdx((i) => Math.min(i + 1, menuItems.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setFocusedIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" || e.key === "ArrowRight") {
                e.preventDefault();
                const item = menuItems[focusedIdx];
                if (item?.submenu) {
                    setOpenSubmenu(item.id);
                    setSubFocusIdx(0);
                } else {
                    item?.action?.();
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                close();
            }
        };

        document.addEventListener("keydown", handleKeyDown, true);
        return () => document.removeEventListener("keydown", handleKeyDown, true);
    }, [cardId, focusedIdx, openSubmenu, subFocusIdx, menuItems, close]);

    // Auto-focus menu on open
    useEffect(() => {
        if (cardId && menuRef.current) {
            menuRef.current.focus();
        }
    }, [cardId]);

    if (!cardId || !card) return null;

    // Position near the card
    const cardEl = document.getElementById(cardId);
    const rect = cardEl?.getBoundingClientRect();
    const top = rect ? rect.top : 200;
    const left = rect ? rect.right + 8 : 400;

    return (
        <div className="fixed inset-0 z-50" onClick={close}>
            <div
                ref={menuRef}
                className="absolute bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 min-w-[200px] outline-none animate-scale-in"
                style={{
                    top: Math.min(top, window.innerHeight - 300),
                    left: Math.min(left, window.innerWidth - 250),
                }}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
            >
                {menuItems.map((item, idx) => (
                    <div key={item.id} className="relative">
                        <button
                            className={`
                                w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors text-left
                                ${focusedIdx === idx && !openSubmenu
                                    ? "bg-indigo-50 text-indigo-700"
                                    : item.danger
                                        ? "text-red-500 hover:bg-red-50"
                                        : "text-slate-600 hover:bg-slate-50"
                                }
                            `}
                            onClick={() => {
                                if (item.submenu) {
                                    setOpenSubmenu(item.id);
                                    setSubFocusIdx(0);
                                } else {
                                    item.action?.();
                                }
                            }}
                            onMouseEnter={() => setFocusedIdx(idx)}
                        >
                            <item.icon size={14} className="flex-shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {item.submenu && <ChevronRight size={12} className="text-slate-300" />}
                        </button>

                        {/* Submenu */}
                        {openSubmenu === item.id && item.submenu && (
                            <div className="absolute left-full top-0 ml-1 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 min-w-[160px] animate-scale-in">
                                {item.submenu.map((sub, sIdx) => (
                                    <button
                                        key={sub.id}
                                        className={`
                                            w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors text-left
                                            ${subFocusIdx === sIdx
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "text-slate-600 hover:bg-slate-50"
                                            }
                                        `}
                                        onClick={sub.action}
                                        onMouseEnter={() => setSubFocusIdx(sIdx)}
                                    >
                                        {sub.color && (
                                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sub.color }} />
                                        )}
                                        <span className="flex-1">{sub.label}</span>
                                        {sub.active && <span className="text-indigo-500 text-[10px] font-bold">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Keyboard Hints */}
                <div className="border-t border-slate-100 mt-1 pt-1.5 px-3.5 pb-1">
                    <span className="text-[9px] text-slate-300 font-medium">
                        ↑↓ Navigate · Enter Select · → Submenu · Esc Close
                    </span>
                </div>
            </div>
        </div>
    );
}
