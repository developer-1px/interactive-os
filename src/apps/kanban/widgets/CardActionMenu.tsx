import {
  DeleteCard,
  MoveCardToColumn,
  SetPriority,
  ToggleLabel,
} from "@apps/kanban/features/commands/card";
import { DuplicateCard } from "@apps/kanban/features/commands/clipboard";
import { CloseActionMenu } from "@apps/kanban/features/commands/menu";
import type { KanbanState, Priority } from "@apps/kanban/model/appState";
import { Trigger } from "@os/app/export/primitives/Trigger";
import type { BaseCommand } from "@os/entities/BaseCommand";
import { useEngine } from "@os/features/command/ui/CommandContext";
import {
  ArrowRight,
  ChevronRight,
  Copy,
  Flame,
  Tag,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  command?: BaseCommand;
  danger?: boolean;
  submenu?: SubMenuItem[];
}

interface SubMenuItem {
  id: string;
  label: string;
  color?: string;
  active?: boolean;
  command: BaseCommand;
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
  const menuItems: MenuItem[] = card
    ? [
        {
          id: "priority",
          label: "Set Priority",
          icon: Flame,
          submenu: (
            ["urgent", "high", "medium", "low", "none"] as Priority[]
          ).map((p) => ({
            id: p,
            label: p.charAt(0).toUpperCase() + p.slice(1),
            color:
              p === "urgent"
                ? "#ef4444"
                : p === "high"
                  ? "#f97316"
                  : p === "medium"
                    ? "#eab308"
                    : p === "low"
                      ? "#3b82f6"
                      : "#94a3b8",
            active: card.priority === p,
            command: SetPriority({ id: card.id, priority: p }),
          })),
        },
        {
          id: "labels",
          label: "Toggle Label",
          icon: Tag,
          submenu: Object.values(state?.data.labels).map((label) => ({
            id: label.id,
            label: label.name,
            color: label.color,
            active: card.labels.includes(label.id),
            command: ToggleLabel({ id: card.id, labelId: label.id }),
          })),
        },
        {
          id: "move-right",
          label: "Move Right",
          icon: ArrowRight,
          command: MoveCardToColumn({ id: card.id, direction: "right" }),
        },
        {
          id: "duplicate",
          label: "Duplicate",
          icon: Copy,
          command: DuplicateCard({ id: card.id }),
        },
        {
          id: "delete",
          label: "Delete",
          icon: Trash2,
          danger: true,
          command: DeleteCard({ id: card.id }),
        },
      ]
    : [];

  // Helper: dispatch a command and close
  const dispatchAndClose = useCallback(
    (cmd: BaseCommand) => {
      dispatch(cmd);
      close();
    },
    [dispatch, close],
  );

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
          dispatchAndClose(sub[subFocusIdx]?.command);
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
        } else if (item?.command) {
          dispatchAndClose(item.command);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };

    // eslint-disable-next-line pipeline/no-imperative-handler -- Action menu overlay captures keyboard globally before OS pipeline
    document.addEventListener("keydown", handleKeyDown, true);
    // eslint-disable-next-line pipeline/no-imperative-handler -- cleanup
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [
    cardId,
    focusedIdx,
    openSubmenu,
    subFocusIdx,
    menuItems,
    close,
    dispatchAndClose,
  ]);

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
    <Trigger onPress={CloseActionMenu({})} asChild>
      <div className="fixed inset-0 z-50">
        <div
          ref={menuRef}
          className="absolute bg-kanban-surface rounded-xl border border-slate-200 shadow-float py-1.5 min-w-[200px] outline-none animate-scale-in"
          style={{
            top: Math.min(top, window.innerHeight - 300),
            left: Math.min(left, window.innerWidth - 250),
          }}
          tabIndex={-1}
        >
          {menuItems.map((item, idx) => (
            <div key={item.id} className="relative">
              <Trigger
                onPress={
                  item.submenu
                    ? CloseActionMenu({}) // dummy — submenu toggle handled locally
                    : item.command!
                }
                dispatch={(cmd) => {
                  if (item.submenu) {
                    setOpenSubmenu(item.id);
                    setSubFocusIdx(0);
                  } else {
                    dispatch(cmd);
                    close();
                  }
                }}
                asChild
                allowPropagation
              >
                <button
                  className={`
                                w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors text-left
                                ${
                                  focusedIdx === idx && !openSubmenu
                                    ? "bg-indigo-50 text-indigo-700"
                                    : item.danger
                                      ? "text-red-500 hover:bg-red-50"
                                      : "text-slate-600 hover:bg-slate-50"
                                }
                            `}
                  onMouseEnter={() => setFocusedIdx(idx)}
                >
                  <item.icon size={14} className="flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.submenu && (
                    <ChevronRight size={12} className="text-slate-300" />
                  )}
                </button>
              </Trigger>

              {/* Submenu */}
              {openSubmenu === item.id && item.submenu && (
                <div className="absolute left-full top-0 ml-1 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 min-w-[160px] animate-scale-in">
                  {item.submenu.map((sub, sIdx) => (
                    <Trigger
                      key={sub.id}
                      onPress={sub.command}
                      dispatch={(cmd) => dispatchAndClose(cmd)}
                      asChild
                      allowPropagation
                    >
                      <button
                        className={`
                                            w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors text-left
                                            ${
                                              subFocusIdx === sIdx
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "text-slate-600 hover:bg-slate-50"
                                            }
                                        `}
                        onMouseEnter={() => setSubFocusIdx(sIdx)}
                      >
                        {sub.color && (
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: sub.color }}
                          />
                        )}
                        <span className="flex-1">{sub.label}</span>
                        {sub.active && (
                          <span className="text-indigo-500 text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    </Trigger>
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
    </Trigger>
  );
}
