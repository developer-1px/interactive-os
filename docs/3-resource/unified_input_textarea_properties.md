# Unified Input/TextArea Component Component Specifications

This document outlines the standard properties and behaviors for a unified "Field" component that handles both single-line (Input) and multi-line (Textarea) scenarios. It aggregates best practices from modern design systems (Material, Ant Design, Tailwind UI) and headless libraries.

## Core Concept
Instead of separate `<Input />` and `<Textarea />` components, we use a single `<Field />` component that adapts its rendering based on props. This ensures a consistent API for focus, validation, and styling.

## 1. Mode Control (Single vs Multi-line)

The primary differentiator is whether the field allows newlines.

| Prop Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `multiline` | `boolean` | `false` | If `true`, the component renders as a multi-line field (like a textarea). If `false`, it renders as a single-line input. |

**Rationale:** `multiline` is the most common and explicit naming convention (MUI, React Native).

## 2. Text Input Attributes (Universal)

These props apply regardless of mode.

| Prop Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string` | `""` | Controlled value. |
| `defaultValue` | `string` | - | Uncontrolled initial value. |
| `placeholder` | `string` | - | Helper text shown when empty. |
| `disabled` | `boolean` | `false` | Disables interaction and applies visual disabled state. |
| `readOnly` | `boolean` | `false` | Prevents editing but allows selection/copying. |
| `autoFocus` | `boolean` | `false` | Automatically focuses on mount. |
| `maxLength` | `number` | - | Enforces character limit. |
| `name` | `string` | - | Form field name. |

## 3. Sizing & Auto-Grow (Multiline Specific)

When `multiline={true}`, we need to control vertical sizing dynamics.

| Prop Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `minRows` | `number` | `1` | Minimum number of visible lines. |
| `maxRows` | `number` | `Infinity` | Maximum number of visible lines before scrolling occurs. |
| `autoGrow` | `boolean` | `false`* | If `true`, height adjusts automatically to fit content within `minRows` and `maxRows`. |
| `rows` | `number` | - | Fixed number of rows (if `autoGrow` is false). |

**Behavior Logic:**
- **Fixed Height:** `multiline={true}` + `rows={4}` -> Fixed height, scrolls if content exceeds.
- **Auto Grow:** `multiline={true}` + `autoGrow={true}` + `minRows={1}` + `maxRows={5}` -> Starts at 1 line, grows up to 5 lines, then scrolls.
- **Single Line:** `multiline={false}` -> Ignores row props.

## 4. Resizing (Manual)

Some design systems allow the user to manually drag-resize the field (standard `<textarea>` behavior).

| Prop Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `resize` | `'none' \| 'vertical' \| 'horizontal' \| 'both'` | `'none'` | Controls the CSS `resize` property. usually defaults to `'none'` in auto-growing fields to avoid conflict. |

## 5. Visual Variants & States

| Prop Name | Type | Key Values | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `string` | `'outline'`, `'filled'`, `'flushed'` | Visual style of the container. |
| `size` | `string` | `'sm'`, `'md'`, `'lg'` | Affects padding and font-size. |
| `isInvalid` | `boolean` | `false` | Applies error styling (red border). |
| `isLoading` | `boolean` | `false` | Shows a loading indicator (e.g. right side). |

## 6. Icon Adornments (Slots)

Common pattern for inputs (search icon, clear button).

| Prop Name | Type | Description |
| :--- | :--- | :--- |
| `startAdornment` | `ReactNode` | Element placed before the text (e.g. search icon). |
| `endAdornment` | `ReactNode` | Element placed after the text (e.g. clear button, character count). |

## 7. Event Handlers

| Prop Name | Description |
| :--- | :--- |
| `onChange` | Standard change handler. |
| `onFocus` | Focus handler. |
| `onBlur` | Blur handler. |
| `onKeyDown` | **Critical for custom behaviors** (e.g. `Enter` to submit vs `Shift+Enter` for newline). |

## 8. Implementation Note: ContentEditable

Since our `Field` is based on `contenteditable`:

- `multiline={false}`:
  - Intercepts `Enter` key to prevent newline insertion.
  - CSS `white-space: nowrap`.
  - Content stays on one line.
  
- `multiline={true}`:
  - Allows `Enter` (or uses `Shift+Enter` depending on config).
  - CSS `white-space: pre-wrap`.
  
- `autoGrow`:
  - `contenteditable` naturally auto-grows.
  - We strictly control `max-height` (via `maxRows` calculation) and `overflow-y: auto`.

## Proposed Unified Interface

```typescript
interface FieldProps extends HTMLAttributes<HTMLElement> {
  // Mode
  multiline?: boolean; // Default: false
  
  // Sizing (Multiline only)
  autoGrow?: boolean; // Default: false (or true if multiline?)
  minRows?: number;
  maxRows?: number;
  
  // Visuals
  variant?: 'outline' | 'filled' | 'ghost';
  isInvalid?: boolean;
  
  // Slots
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  
  // Standard
  value: string;
  placeholder?: string;
  disabled?: boolean;
  
  // Actions
  onValueChange?: (value: string) => void;
  onSubmit?: () => void; // Triggered by Enter (if single line) or Cmd+Enter
}
```
