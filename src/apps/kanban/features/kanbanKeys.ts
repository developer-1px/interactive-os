import {
  CancelEditCard,
  MoveCardDown,
  MoveCardToColumn,
  MoveCardUp,
  StartEditCard,
  UpdateCardText,
} from "@apps/kanban/features/commands/card";
import { DuplicateCard } from "@apps/kanban/features/commands/clipboard";
import { AddColumn } from "@apps/kanban/features/commands/column";
import {
  CloseCardDetail,
  OpenCardDetail,
} from "@apps/kanban/features/commands/detail";
import { Redo, Undo } from "@apps/kanban/features/commands/history";
import {
  CloseActionMenu,
  OpenActionMenu,
} from "@apps/kanban/features/commands/menu";
import {
  DeselectAll,
  ToggleCardSelection,
} from "@apps/kanban/features/commands/selection";
import { OS } from "@os/features/AntigravityOS";
import type { KeymapConfig } from "@os/new/1-sensor/keyboard/getCanonicalKey.ts";
import { createLogicExpect, Rule } from "@os/features/logic/lib/Rule";

interface KanbanContext {
  activeZone: string | null;
  isEditing: boolean;
  isDraftFocused: boolean;
  isSearchActive: boolean;
  isDetailOpen: boolean;
  isMenuOpen: boolean;
  hasSelection: boolean;
}

const Expect = createLogicExpect<KanbanContext>();
const notEditing = Expect("isEditing").toBe(false);
const notDraft = Expect("isDraftFocused").toBe(false);
const noOverlay = Rule.and(
  Expect("isDetailOpen").toBe(false),
  Expect("isMenuOpen").toBe(false),
);
const baseCondition = Rule.and(notEditing, notDraft, noOverlay);

export const KANBAN_KEYMAP: KeymapConfig<any> = {
  global: [
    // Add new column
    { key: "Meta+Shift+N", command: AddColumn, allowInInput: true },
    // Undo/Redo
    { key: "Meta+Z", command: Undo },
    { key: "Meta+Shift+Z", command: Redo },
  ],
  zones: {
    "kanban-board": [
      // --- Card movement between columns ---
      {
        key: "Meta+ArrowLeft",
        command: MoveCardToColumn,
        args: { id: OS.FOCUS, direction: "left" },
        when: baseCondition,
      },
      {
        key: "Meta+ArrowRight",
        command: MoveCardToColumn,
        args: { id: OS.FOCUS, direction: "right" },
        when: baseCondition,
      },
      // --- Reorder within column ---
      {
        key: "Meta+ArrowUp",
        command: MoveCardUp,
        args: { id: OS.FOCUS },
        when: baseCondition,
      },
      {
        key: "Meta+ArrowDown",
        command: MoveCardDown,
        args: { id: OS.FOCUS },
        when: baseCondition,
      },
      // --- Inline Editing ---
      {
        key: "Enter",
        command: StartEditCard,
        args: { id: OS.FOCUS },
        when: Rule.and(notEditing, notDraft, noOverlay),
      },
      {
        key: "Enter",
        command: UpdateCardText,
        when: Expect("isEditing").toBe(true),
        allowInInput: true,
      },
      {
        key: "Escape",
        command: CancelEditCard,
        when: Expect("isEditing").toBe(true),
        allowInInput: true,
      },
      // --- Card Detail Sheet ---
      {
        key: "Shift+Enter",
        command: OpenCardDetail,
        args: { id: OS.FOCUS },
        when: baseCondition,
      },
      // --- Action Menu ---
      {
        key: ",",
        command: OpenActionMenu,
        args: { id: OS.FOCUS },
        when: baseCondition,
      },
      // --- Selection ---
      {
        key: "Space",
        command: ToggleCardSelection,
        args: { id: OS.FOCUS },
        when: baseCondition,
      },
      {
        key: "Escape",
        command: DeselectAll,
        when: Rule.and(
          Expect("hasSelection").toBe(true),
          notEditing,
          noOverlay,
        ),
      },
      // --- Clipboard ---
      {
        key: "Meta+D",
        command: DuplicateCard,
        args: { id: OS.FOCUS },
        when: baseCondition,
      },
    ],

    // --- Detail Sheet Zone Bindings ---
    "card-detail": [
      {
        key: "Escape",
        command: CloseCardDetail,
        allowInInput: true,
      },
    ],

    // --- Action Menu Zone Bindings ---
    "action-menu": [
      {
        key: "Escape",
        command: CloseActionMenu,
      },
    ],
  },
};
