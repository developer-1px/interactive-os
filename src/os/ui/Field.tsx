import {
  useState,
  useRef,
  useEffect,
  isValidElement,
  cloneElement,
} from "react";
import type {
  ReactNode,
  ReactElement,
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  InputHTMLAttributes,
} from "react";
import { useCommandEngine } from "@os/core/command/CommandContext";
import { useContextService } from "@os/core/context";
import type { BaseCommand } from "@os/ui/types";

export interface FieldProps<T extends BaseCommand>
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value" | "name" | "onBlur" | "onFocus"
  > {
  value: string;
  active?: boolean;
  autoFocus?: boolean;
  updateType?: string;
  name?: string;
  commitCommand?: T;
  syncCommand?: BaseCommand;
  cancelCommand?: BaseCommand;
  children?: ReactNode;
  asChild?: boolean;
  dispatch?: (cmd: BaseCommand) => void;
  commitOnBlur?: boolean;
}

import { useFocusStore } from "@os/core/focus";

export const Field = <T extends BaseCommand>({
  value,
  active,

  updateType,
  name,
  commitCommand,
  syncCommand,
  cancelCommand,
  children,
  asChild,
  commitOnBlur = true,
  blurOnInactive = false,
  dispatch: customDispatch,
  ...rest
}: FieldProps<T> & { blurOnInactive?: boolean }) => {
  const { dispatch: contextDispatch, currentFocusId } = useCommandEngine();
  // Safe Context Usage: Check if we are inside a provider that supports updating context
  const contextService = useContextService();
  const updateContext = contextService?.updateContext || (() => { }); // Fallback

  // OS-Level Direct Subscription (Faster/Robust than Context for pure Focus state)
  const osFocusedItemId = useFocusStore((s) => s.focusedItemId);

  const dispatch = customDispatch || contextDispatch;
  const [localValue, setLocalValue] = useState(value);
  const innerRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<{ start: number | null; end: number | null }>({
    start: null,
    end: null,
  });

  /* 
    Refactored Field Primitive: 
    - Purely Reactive to "Active" State.
    - No App-specific Logic (DRAFT).
    - Strict ID Matching.
  */

  const isActive =
    active !== undefined
      ? active
      : (name !== undefined && String(name) === String(currentFocusId)) ||
      (name !== undefined && String(name) === String(osFocusedItemId));

  useEffect(() => {
    if (!isComposingRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  // Auto-focus and Cursor Restoration
  // Driven strictly by `isActive`
  useEffect(() => {
    if (isActive && innerRef.current) {
      // 1. If already focused, do nothing
      if (document.activeElement === innerRef.current) {
        return;
      }

      // 2. Claim physical focus
      innerRef.current.focus();

      // 3. Restore Selection Range (if applicable)
      if (cursorRef.current.start !== null && cursorRef.current.end !== null) {
        const { start, end } = cursorRef.current;
        requestAnimationFrame(() => {
          if (innerRef.current) {
            try {
              innerRef.current.setSelectionRange(start, end);
            } catch (e) {
              // Safe to ignore
            }
          }
        });
      }
    } else if (!isActive && blurOnInactive && innerRef.current && document.activeElement === innerRef.current) {
      // Feature: Configurable Focus Retention
      innerRef.current.blur();
    }
  }, [isActive, blurOnInactive]);

  const commitChange = (value: string) => {
    if (innerRef.current) {
      cursorRef.current = {
        start: innerRef.current.selectionStart,
        end: innerRef.current.selectionEnd,
      };
    }

    if (commitCommand) {
      // Generic Payload Injection
      dispatch({
        ...commitCommand,
        payload: { ...commitCommand.payload, text: value },
      });
      return;
    }
    if (value === value) return; // Weird check?
    if (name) dispatch({ type: "PATCH", payload: { [name]: value } });
    else if (updateType) dispatch({ type: updateType, payload: { text: value } });
  };

  const isComposingRef = useRef(false);

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
  };

  // --- Context Sensor Logic ---
  const updateCursorContext = () => {
    if (!innerRef.current) return;
    const start = innerRef.current.selectionStart;
    const end = innerRef.current.selectionEnd;

    // Keep cursorRef in sync with actual user interaction for accurate restoration
    cursorRef.current = { start, end };

    // Report specific cursor state to context
    updateContext({
      cursorAtStart: start === 0 && end === 0,
      cursorAtEnd:
        start === innerRef.current.value.length &&
        end === innerRef.current.value.length,
    });
  };

  // Separate onKeyDown to allow correct composition
  const { onKeyDown: externalKeyDown, ...otherProps } = rest as any;

  const baseProps = {
    ref: innerRef,
    value: localValue,
    onFocus: () => {
      // console.log('Field: Setting focus to', name);
      // GUARD: Only dispatch if we aren't already the focus.
      // This prevents "Focus Stealing Loops" and "Max Update Depth" errors.
      if (name && currentFocusId !== name) {
        dispatch({ type: "SET_FOCUS", payload: { id: name } });
      }

      // Still update context (safe, it's just a boolean flag)
      if (!contextService?.context.isFieldFocused) {
        updateContext({ isFieldFocused: true });
      }

      // Initial check on focus
      requestAnimationFrame(updateCursorContext);
    },
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalValue(value);
      // Sync cursor context immediately
      updateCursorContext();

      if (syncCommand)
        dispatch({
          ...syncCommand,
          payload: { ...syncCommand.payload, text: value },
        });
      else if (name) dispatch({ type: "PATCH", payload: { [name]: value } });
      else if (updateType)
        dispatch({ type: updateType, payload: { text: value } });

      // While typing, we are NOT at start unless empty (handled by next render/event usually, but good to check)
    },
    onSelect: updateCursorContext,
    onKeyUp: updateCursorContext,
    onClick: updateCursorContext,
    onBlur: () => {
      if (commitOnBlur) {
        commitChange(localValue);
      }
      updateContext({
        isFieldFocused: false,
        cursorAtStart: false,
        cursorAtEnd: false,
      });
    },
    onKeyDown: (e: ReactKeyboardEvent) => {
      // 1. IME Safety Only. 
      // InputEngine's global listener respects 'e.isComposing', so we allow bubbling.
      // But we prevent internal key duplication if needed.

      if (e.nativeEvent.isComposing || isComposingRef.current) {
        if (["Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
          // Stop propagation to prevent Zone navigation while typing in IME
          e.stopPropagation();
        }
        if (e.key === "Enter") e.preventDefault();
        return;
      }

      // 2. Cancellation (Standard for Inputs)
      if (e.key === "Escape") {
        // Escape is usually safe to propagate for "Global Cancel", 
        // BUT standard input behavior is "Clear or Blur".
        // We let the Global Registry handle ESC -> CANCEL_EDIT
      }

      // 3. Commit (Enter)
      if (e.key === "Enter") {
        // We let it BUBBLE to the Global InputEngine.
        // The InputEngine sees "Enter", checks Registry for "COMMIT_EDIT" (when: isEditing).
        // It fires.

        // CORRECTION: We intentionally do NOT prevent default here.
        // We rely on InputEngine to catch it if there's a binding.
        // If we block it here, InputEngine ignores it (defaultPrevented check).
      }

      // External handler support (for legacy)
      if (externalKeyDown) externalKeyDown(e);
    },
    ...otherProps,
  };

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<any>;
    return cloneElement(child, {
      ...baseProps,
      onFocus: (e: any) => {
        child.props.onFocus?.(e);
        baseProps.onFocus();
      },
    });
  }

  // --- Mode Switch Implementation ---
  // If NOT active, we render a 'fake' input (span) to prevent browser interaction.
  if (!isActive) {
    return (
      <span
        className={`pointer-events-none truncate ${otherProps.className || ""}`}
      // We might want to maintain some visual semblance if it was an input
      >
        {localValue || otherProps.placeholder || ""}
      </span>
    );
  }

  return <input type="text" {...baseProps} autoFocus />;
};
