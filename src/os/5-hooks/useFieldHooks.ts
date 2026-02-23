import type { MutableRefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FieldRegistry } from "../6-components/field/FieldRegistry";
import { getCaretPosition, setCaretPosition } from "./getCaretPosition";

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
  /** Field identifier for FieldRegistry caret persistence */
  fieldId?: string;
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
 */
export const useFieldDOMSync = ({
  innerRef,
  localValue,
  isActive,
  cursorRef: _cursorRef,
}: UseFieldDOMSyncProps) => {
  useLayoutEffect(() => {
    if (innerRef.current) {
      innerRef.current.innerText = localValue;
    }
  }, [innerRef.current, localValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    if (!innerRef.current) return;
    if (isActive) return;
    if (innerRef.current.innerText !== localValue) {
      innerRef.current.innerText = localValue;
    }
  }, [localValue, isActive, innerRef]);
};

/**
 * Manages physical focus and blur of the DOM element based on `isActive` state.
 *
 * Caret position lifecycle:
 *   1. active→inactive: save caret via getCaretPosition → FieldRegistry
 *   2. inactive→active: restore caret from FieldRegistry → setCaretPosition
 *
 * This makes caret position a state concern (headless-testable)
 * rather than a DOM-only concern.
 */
export const useFieldFocus = ({
  innerRef,
  isActive,
  blurOnInactive,
  cursorRef,
  fieldId,
}: UseFieldFocusProps) => {
  // Track previous active state to detect inactive→active transition.
  // setCaretPosition must only run ONCE on initial entry into edit mode,
  // not on every re-render while active (which causes addRange → browser auto-scroll).
  const wasActiveRef = useRef(false);

  useEffect(() => {
    if (isActive && innerRef.current) {
      const isFirstEntry = !wasActiveRef.current;
      wasActiveRef.current = true;

      if (document.activeElement !== innerRef.current) {
        innerRef.current.focus({ preventScroll: true });
      }

      // Restore caret position only on initial entry (inactive→active transition)
      if (isFirstEntry) {
        // Read saved position from FieldRegistry (state), fallback to cursorRef (legacy)
        const savedPosition = fieldId
          ? (FieldRegistry.getField(fieldId)?.state.caretPosition ?? null)
          : cursorRef.current;

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (innerRef.current) {
              try {
                if (savedPosition !== null) {
                  setCaretPosition(innerRef.current, savedPosition);
                } else {
                  const textLength = innerRef.current.innerText.length;
                  setCaretPosition(innerRef.current, textLength);
                }
              } catch (_e) { }
            }
          });
        });
      }
    } else if (!isActive) {
      // Save caret position before deactivating (active→inactive transition)
      if (wasActiveRef.current && innerRef.current && fieldId) {
        try {
          const pos = getCaretPosition(innerRef.current);
          FieldRegistry.updateCaretPosition(fieldId, pos);
        } catch (_e) { }
      }

      // Always reset so the next inactive→active transition is detected
      wasActiveRef.current = false;

      if (
        blurOnInactive &&
        innerRef.current &&
        document.activeElement === innerRef.current
      ) {
        innerRef.current.blur();
      }
    }
  }, [isActive, blurOnInactive, innerRef, cursorRef, fieldId]);
};

/**
 * Manages cursor position tracking within the field.
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

  return { updateCursorContext };
};
