import { FieldRegistry } from "@os-core/engine/registries/fieldRegistry";
import type { MutableRefObject } from "react";
import { useEffect, useRef } from "react";
import { getCaretPosition, setCaretPosition } from "./getCaretPosition";

// --- Types ---

interface UseFieldFocusProps {
  innerRef: MutableRefObject<HTMLElement | null>;
  isActive: boolean;
  blurOnInactive: boolean;
  cursorRef: MutableRefObject<number | null>;
  /** Field identifier for FieldRegistry caret persistence */
  fieldId?: string;
  /** Whether the field is in editing mode (contentEditable) */
  isEditing?: boolean;
}

/**
 * Manages physical focus and blur of the DOM element based on `isActive` state.
 *
 * Caret position lifecycle (OS pipeline integration):
 *   1. During editing: selectionchange → FieldRegistry.caretPosition (continuous, silent)
 *   2. OS_FIELD_COMMIT/CANCEL: FieldRegistry → ZoneState.caretPositions (command, Inspector visible)
 *   3. not-editing→editing: FieldRegistry.caretPosition → setCaretPosition (DOM effect)
 *
 * Key insight: In deferred mode, isActive (= isFocused) becomes true BEFORE editing.
 * So caret restore must be triggered by the isEditing transition, not the isActive transition.
 */
export const useFieldFocus = ({
  innerRef,
  isActive,
  blurOnInactive,
  cursorRef,
  fieldId,
  isEditing = false,
}: UseFieldFocusProps) => {
  // Track focus transition (for DOM focus/blur management)
  const wasActiveRef = useRef(false);
  // Track editing transition separately (for caret restore)
  // In deferred mode, focus happens before editing — these are distinct transitions.
  const wasEditingRef = useRef(false);

  // Continuous caret tracking via selectionchange (when editing + fieldId)
  useEffect(() => {
    if (!isEditing || !fieldId || !innerRef.current) return;

    const el = innerRef.current;
    const onSelectionChange = () => {
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      if (!el.contains(sel.anchorNode)) return;
      try {
        const pos = getCaretPosition(el);
        FieldRegistry.updateCaretPosition(fieldId, pos);
      } catch (_e) {}
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", onSelectionChange);
  }, [isEditing, fieldId, innerRef]);

  // Focus/blur management (triggered by isActive = isFocused)
  useEffect(() => {
    if (isActive && innerRef.current) {
      const isFirstFocus = !wasActiveRef.current;
      wasActiveRef.current = true;

      if (document.activeElement !== innerRef.current) {
        innerRef.current.focus({ preventScroll: true });
      }

      // On first focus (no editing yet), move caret to end
      if (isFirstFocus && !isEditing) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (innerRef.current) {
              try {
                const textLength = innerRef.current.innerText.length;
                setCaretPosition(innerRef.current, textLength);
              } catch (_e) {}
            }
          });
        });
      }
    } else if (!isActive) {
      wasActiveRef.current = false;

      if (
        blurOnInactive &&
        innerRef.current &&
        document.activeElement === innerRef.current
      ) {
        innerRef.current.blur();
      }
    }
  }, [isActive, blurOnInactive, innerRef, isEditing]);

  // Caret restore on editing transition (not-editing → editing)
  useEffect(() => {
    if (isEditing && !wasEditingRef.current && innerRef.current && fieldId) {
      wasEditingRef.current = true;

      const savedPosition =
        FieldRegistry.getField(fieldId)?.state.caretPosition ?? null;

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
            } catch (_e) {}
          }
        });
      });
    } else if (!isEditing) {
      wasEditingRef.current = false;
    }
  }, [isEditing, fieldId, innerRef]);
};
