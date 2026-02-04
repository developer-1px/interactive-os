import type { BaseCommand } from "./types";

/**
 * Determines if the field should be considered "active" (focused/editable).
 */
export const shouldActivateField = (
    activeProp: boolean | undefined,
    name: string | undefined,
    currentFocusId: string | number | null | undefined,
    osFocusedItemId: string | null
): boolean => {
    if (activeProp !== undefined) return activeProp;
    if (name !== undefined) {
        // Loose comparison for IDs that might be numbers
        return String(name) === String(currentFocusId) || String(name) === String(osFocusedItemId);
    }
    return false;
};

/**
 * Checks if the value is effectively empty for placeholder display.
 * Handles ContentEditable's tendency to leave a single newline.
 */
export const checkValueEmpty = (value: string | undefined | null): boolean => {
    return !value || value === "\n";
};

export interface FieldStyleParams {
    isActive: boolean;
    multiline: boolean;
    value: string;
    placeholder?: string;
    customClassName?: string;
}

/**
 * Composes the Tailwind classes for the field.
 * Handles:
 * - Active/Inactive pointer events
 * - Multiline vs Single-line layout
 * - Placeholder pseudo-element classes
 */
export const getFieldClasses = ({
    isActive,
    multiline,
    value,
    placeholder,
    customClassName = "",
}: FieldStyleParams): string => {
    // Base styles
    const baseStyles = isActive
        ? customClassName
        : `pointer-events-none truncate ${customClassName}`;

    // Placeholder logic
    const isEmpty = checkValueEmpty(value);
    const shouldShowPlaceholder = placeholder && isEmpty;
    const placeholderClasses = shouldShowPlaceholder
        ? "before:content-[attr(data-placeholder)] before:text-slate-400 before:opacity-50 before:pointer-events-none before:absolute before:top-0 before:left-0 before:truncate before:w-full before:h-full"
        : "";

    // Layout logic
    const lineClasses = multiline
        ? "whitespace-pre-wrap break-words"
        : "whitespace-nowrap overflow-hidden";

    const displayClasses = multiline
        ? "block"
        : "inline-block min-w-[1ch] max-w-full align-bottom";

    return `${placeholderClasses} ${baseStyles} ${lineClasses} ${displayClasses} relative min-h-[1lh]`.trim();
};

/**
 * Determines the action to dispatch when committing a change.
 */
export const getCommitAction = (
    text: string,
    commitCommand?: BaseCommand,
    name?: string,
    updateType?: string
): BaseCommand | null => {
    if (commitCommand) {
        return {
            ...commitCommand,
            payload: { ...commitCommand.payload, text },
        };
    }

    if (name) {
        return { type: "PATCH", payload: { [name]: text } };
    }

    if (updateType) {
        return { type: updateType, payload: { text } };
    }

    return null;
};

/**
 * Determines the action to dispatch when syncing input (typing).
 */
export const getSyncAction = (
    text: string,
    syncCommand?: BaseCommand,
    name?: string,
    updateType?: string
): BaseCommand | null => {
    if (syncCommand) {
        return {
            ...syncCommand,
            payload: { ...syncCommand.payload, text },
        };
    }

    if (name) {
        return { type: "PATCH", payload: { [name]: text } };
    }

    if (updateType) {
        return { type: updateType, payload: { text } };
    }

    return null;
};
