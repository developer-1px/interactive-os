import type { MutableRefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getCaretPosition, setCaretPosition } from "@/os-new/lib/getCaretPosition";

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
  }, [value, localValue]);

  return { localValue, setLocalValue, isComposingRef };
};

/**
 * Synchronizes the value prop to the DOM `innerText`.
 *
 * SIMPLE RULE: Only sync when NOT active (not focused/editing).
 * contentEditable manages its own DOM during editing.
 * Sync happens only on:
 * - Mount (initial value)
 * - Blur (when isActive becomes false)
 */
export const useFieldDOMSync = ({
  innerRef,
  localValue,
  isActive,
  cursorRef: _cursorRef,
}: UseFieldDOMSyncProps) => {
  // Sync on mount
  useLayoutEffect(() => {
    if (innerRef.current) {
      innerRef.current.innerText = localValue;
    }
  }, [innerRef.current, localValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync on blur only
  useLayoutEffect(() => {
    if (!innerRef.current) return;

    // Skip sync while active - let contentEditable manage DOM
    if (isActive) return;

    // Sync when not active (blur)
    if (innerRef.current.innerText !== localValue) {
      innerRef.current.innerText = localValue;
    }
  }, [localValue, isActive, innerRef]);
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

      // Restore Cursor on Focus Gain
      // Use double RAF to ensure DOM content is synced first
      // If no cursor position stored (null), place cursor at end of text
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (innerRef.current) {
            try {
              if (cursorRef.current !== null) {
                // Restore to saved position
                setCaretPosition(innerRef.current, cursorRef.current);
              } else {
                // No saved position - move to end
                const textLength = innerRef.current.innerText.length;
                setCaretPosition(innerRef.current, textLength);
              }
            } catch (_e) { }
          }
        });
      });
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
 * Manages cursor position tracking within the field.
 * Returns helper functions for updating cursor context.
 * (Simplified: No longer uses GlobalContext, just local refs)
 */
export const useFieldContext = (
  innerRef: MutableRefObject<HTMLElement | null>,
  cursorRef: MutableRefObject<number | null>,
) => {
  const updateCursorContext = () => {
    if (!innerRef.current) return;
    const pos = getCaretPosition(innerRef.current);
    cursorRef.current = pos;
  };

  const setFieldFocused = (_isFocused: boolean) => {
    // No-op: Field focus is now tracked by useFocusStore
  };

  return { updateCursorContext, setFieldFocused };
};
