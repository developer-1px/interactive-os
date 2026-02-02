
import type { KeymapConfig } from './keybinding';
import type { TodoCommandId } from './todo_types';
import { createLogicExpect, createLogicRule } from './logic/builder';
import type { TodoContext } from './logic/schema';

// 1. Strict Context Builders
const Expect = createLogicExpect<TodoContext>();
const Rule = createLogicRule<TodoContext>();

// 4. Default Keymap Definition (Hierarchical)
export const TODO_KEYMAP: KeymapConfig<TodoCommandId> = {
    global: [
        { key: 'Meta+z', command: 'UNDO' },
        { key: 'Meta+Shift+Z', command: 'REDO' }
    ],
    zones: {
        sidebar: [
            { key: 'Meta+ArrowUp', command: 'MOVE_CATEGORY_UP' },
            { key: 'Meta+ArrowDown', command: 'MOVE_CATEGORY_DOWN' },
            { key: 'Enter', command: 'SELECT_CATEGORY' },
            { key: 'Space', command: 'SELECT_CATEGORY' },
            { key: 'ArrowRight', command: 'JUMP_TO_LIST' }
        ],
        todoList: [
            // Navigation
            { key: 'ArrowUp', command: 'MOVE_FOCUS_UP' },
            { key: 'ArrowDown', command: 'MOVE_FOCUS_DOWN' },
            // Structure
            { key: 'Meta+ArrowUp', command: 'MOVE_ITEM_UP' },
            { key: 'Meta+ArrowDown', command: 'MOVE_ITEM_DOWN' },
            // Creation (Strict Draft Guard)
            {
                key: 'Enter',
                command: 'ADD_TODO',
                when: Expect('isDraftFocused').toBe(true)
            },
            // Editing Triggers
            {
                key: 'Enter',
                command: 'START_EDIT',
                when: Rule.and(
                    Expect('isEditing').toBe(false),
                    Expect('isDraftFocused').toBe(false)
                )
            },
            {
                key: 'Enter',
                command: 'UPDATE_TODO_TEXT',
                when: Expect('isEditing').toBe(true)
            },
            {
                key: 'Escape',
                command: 'CANCEL_EDIT',
                when: Expect('isEditing').toBe(true)
            },
            // Deletion & Toggle (No Edit Guard)
            {
                key: 'Backspace',
                command: 'DELETE_TODO',
                when: Expect('isEditing').toBe(false)
            },
            {
                key: 'Delete',
                command: 'DELETE_TODO',
                when: Expect('isEditing').toBe(false)
            },
            {
                key: 'Space',
                command: 'TOGGLE_TODO',
                when: Expect('isEditing').toBe(false)
            },
            // Cross-Zone
            {
                key: 'ArrowLeft',
                command: 'JUMP_TO_SIDEBAR',
                when: Rule.or(
                    Expect('isEditing').toBe(false),
                    Expect('cursorAtStart' as keyof TodoContext).toBe(true)
                )
            }
        ]
    }
};
