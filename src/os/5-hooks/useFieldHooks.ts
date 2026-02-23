import type { MutableRefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
 */
export const useFieldFocus = ({
  innerRef,
  isActive,
  blurOnInactive,
  cursorRef,
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
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (innerRef.current) {
              try {
                if (cursorRef.current !== null) {
                  setCaretPosition(innerRef.current, cursorRef.current);
                } else {
                  const textLength = innerRef.current.innerText.length;
                  setCaretPosition(innerRef.current, textLength);
                }
              } catch (_e) { }
            }
          });
        });
      }
    } else if (
      !isActive &&
      blurOnInactive &&
      innerRef.current &&
      document.activeElement === innerRef.current
    ) {
      wasActiveRef.current = false;
      innerRef.current.blur();
    }
  }, [isActive, blurOnInactive, innerRef, cursorRef]);
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
