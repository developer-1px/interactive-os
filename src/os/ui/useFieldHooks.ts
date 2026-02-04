import { useState, useRef, useEffect, useLayoutEffect } from "react";
import type { MutableRefObject } from "react";
import { getCaretPosition, setCaretPosition } from "./fieldUtils";
import { useContextService } from "@os/core/context";

// --- Types ---
interface UseFieldStateProps {
    value: string;
}

interface UseFieldDOMSyncProps {
    innerRef: MutableRefObject<HTMLElement | null>;
    localValue: string;
    isActive: boolean;
    cursorRef: MutableRefObject<number | null>;
}

interface UseFieldFocusProps {
    innerRef: MutableRefObject<HTMLElement | null>;
    isActive: boolean;
    blurOnInactive: boolean;
    cursorRef: MutableRefObject<number | null>;
}

// --- Hooks ---

/**
 * Manages the local value state of the field, syncing it with the `value` prop
 * only when not composing.
 */
export const useFieldState = ({ value }: UseFieldStateProps) => {
    const [localValue, setLocalValue] = useState(value);
    const isComposingRef = useRef(false);

    useEffect(() => {
        if (!isComposingRef.current && value !== localValue) {
            setLocalValue(value);
        }
    }, [value]);

    return { localValue, setLocalValue, isComposingRef };
};

/**
 * Synchronizes the local React state value to the DOM `innerText`.
 * Critical for ContentEditable components to behave like controlled inputs.
 * Also restores the cursor position after updates.
 */
export const useFieldDOMSync = ({
    innerRef,
    localValue,
    isActive,
    cursorRef,
}: UseFieldDOMSyncProps) => {
    useLayoutEffect(() => {
        if (innerRef.current) {
            // Always sync innerText to localValue
            if (innerRef.current.innerText !== localValue) {
                innerRef.current.innerText = localValue;

                // Restore cursor if active
                if (isActive && cursorRef.current !== null) {
                    try {
                        setCaretPosition(innerRef.current, cursorRef.current);
                    } catch (e) {
                        // Ignore caret errors during rapid updates
                    }
                }
            }
        }
    }, [localValue, isActive, innerRef, cursorRef]);
};

/**
 * Manages physical focus and blur of the DOM element based on `isActive` state.
 * Also handles cursor restoration on focus gain.
 */
export const useFieldFocus = ({
    innerRef,
    isActive,
    blurOnInactive,
    cursorRef,
}: UseFieldFocusProps) => {
    useEffect(() => {
        if (isActive && innerRef.current) {
            if (document.activeElement !== innerRef.current) {
                innerRef.current.focus();
            }

            // Restore Cursor specifically on Focus Gain
            if (cursorRef.current !== null) {
                requestAnimationFrame(() => {
                    if (innerRef.current && cursorRef.current !== null) {
                        try {
                            setCaretPosition(innerRef.current, cursorRef.current);
                        } catch (e) { }
                    }
                });
            }
        } else if (
            !isActive &&
            blurOnInactive &&
            innerRef.current &&
            document.activeElement === innerRef.current
        ) {
            innerRef.current.blur();
        }
    }, [isActive, blurOnInactive, innerRef, cursorRef]);
};

/**
 * Manages the global context updates related to the field (e.g., cursor position).
 */
export const useFieldContext = (innerRef: MutableRefObject<HTMLElement | null>, cursorRef: MutableRefObject<number | null>) => {
    const contextService = useContextService();
    const updateContext = contextService?.updateContext || (() => { });

    const updateCursorContext = () => {
        if (!innerRef.current) return;
        const pos = getCaretPosition(innerRef.current);
        const textLen = innerRef.current.innerText.length;

        cursorRef.current = pos;

        updateContext({
            cursorAtStart: pos === 0,
            cursorAtEnd: pos === textLen,
        });
    };

    const setFieldFocused = (isFocused: boolean) => {
        if (contextService?.context.isFieldFocused !== isFocused) {
            updateContext({ isFieldFocused: isFocused });
        }
        if (!isFocused) {
            updateContext({
                cursorAtStart: false,
                cursorAtEnd: false,
            });
        }
    };

    return { updateCursorContext, setFieldFocused, contextService };
};
