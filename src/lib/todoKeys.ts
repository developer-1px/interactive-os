
import type { KeymapConfig } from './keybinding';
import type { TodoCommandId } from './todoTypes';
import { createLogicExpect, createLogicRule } from './logic/builder';
import type { TodoContext } from './logic/schema';

// 1. Strict Context Builders
const Expect = createLogicExpect<TodoContext>();
const Rule = createLogicRule<TodoContext>();

// 4. Default Keymap Definition (Hierarchical)
export const TODO_KEYMAP: KeymapConfig<TodoCommandId> = {
    global: [
        { key: 'Meta+z', command: 'UNDO', allowInInput: true },
        { key: 'Meta+Shift+Z', command: 'REDO', allowInInput: true },
        { key: 'Meta+Shift+V', command: 'TOGGLE_VIEW', allowInInput: true }
    ],
    zones: {
        sidebar: [
            { key: 'Meta+ArrowUp', command: 'MOVE_CATEGORY_UP' },
            { key: 'Meta+ArrowDown', command: 'MOVE_CATEGORY_DOWN' },
            { key: 'Enter', command: 'SELECT_CATEGORY' },
            { key: 'Space', command: 'SELECT_CATEGORY' },
            { key: 'ArrowUp', command: 'MOVE_SIDEBAR_FOCUS_UP' },
            { key: 'ArrowDown', command: 'MOVE_SIDEBAR_FOCUS_DOWN' }
        ],
        listView: [
            // Navigation
            { key: 'ArrowUp', command: 'MOVE_FOCUS_UP', allowInInput: true },
            { key: 'ArrowDown', command: 'MOVE_FOCUS_DOWN', allowInInput: true },

            // Structure
            { key: 'Meta+ArrowUp', command: 'MOVE_ITEM_UP' },
            { key: 'Meta+ArrowDown', command: 'MOVE_ITEM_DOWN' },

            // Creation (Strict Draft Guard)
            {
                key: 'Enter',
                command: 'ADD_TODO',
                when: Expect('isDraftFocused').toBe(true),
                allowInInput: true
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
                when: Expect('isEditing').toBe(true),
                allowInInput: true
            },
            {
                key: 'Escape',
                command: 'CANCEL_EDIT',
                when: Expect('isEditing').toBe(true),
                allowInInput: true
            },

            // Deletion & Toggle (No Edit Guard)
            { key: 'Backspace', command: 'DELETE_TODO', when: Expect('isEditing').toBe(false) },
            { key: 'Delete', command: 'DELETE_TODO', when: Expect('isEditing').toBe(false) },
            { key: 'Space', command: 'TOGGLE_TODO', when: Expect('isEditing').toBe(false) },

            // Cross-Zone
            {
                key: 'ArrowLeft',
                command: 'JUMP_TO_SIDEBAR',
                when: Rule.and(
                    Rule.or(
                        Expect('isEditing').toBe(false),
                        Expect('cursorAtStart' as keyof TodoContext).toBe(true)
                    ),
                    Expect('activeZone').toBe('listView')
                ),
                allowInInput: true
            }
        ],
        boardView: [
            // Navigation
            { key: 'ArrowUp', command: 'MOVE_FOCUS_UP', allowInInput: true },
            { key: 'ArrowDown', command: 'MOVE_FOCUS_DOWN', allowInInput: true },

            // Column Navigation (Handled by Zone Neighbors Declaratively)
            // ArrowRight/Left falls through to Zone Spatial Nav

            // Item Actions (Shared)
            { key: 'Space', command: 'TOGGLE_TODO', when: Expect('isEditing').toBe(false) },
            { key: 'Backspace', command: 'DELETE_TODO', when: Expect('isEditing').toBe(false) },
            { key: 'Delete', command: 'DELETE_TODO', when: Expect('isEditing').toBe(false) }
        ]
    }
};
