import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  isValidElement,
  cloneElement,
} from "react";
import type {
  ReactNode,
  ReactElement,
  KeyboardEvent as ReactKeyboardEvent,
  HTMLAttributes,
  FormEvent,
} from "react";
import { useCommandEngine } from "@os/core/command/CommandContext";
import { useContextService } from "@os/core/context";
import { getCaretPosition, setCaretPosition } from "./fieldUtils";
import type { BaseCommand } from "@os/ui/types";
import { useFocusStore } from "@os/core/focus";

export interface FieldProps<T extends BaseCommand>
  extends Omit<
    HTMLAttributes<HTMLElement>,
    "onChange" | "onBlur" | "onFocus"
  > {
  value: string;
  active?: boolean;
  autoFocus?: boolean;
  updateType?: string;
  name?: string;
  placeholder?: string;
  multiline?: boolean;
  commitCommand?: T;
  syncCommand?: BaseCommand;
  cancelCommand?: BaseCommand;
  children?: ReactNode;
  asChild?: boolean;
  dispatch?: (cmd: BaseCommand) => void;
  commitOnBlur?: boolean;
}

export const Field = <T extends BaseCommand>({
  value,
  active,

  updateType,
  name,
  placeholder,
  multiline = false,
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
  const contextService = useContextService();
  const updateContext = contextService?.updateContext || (() => { });

  const osFocusedItemId = useFocusStore((s) => s.focusedItemId);

  const dispatch = customDispatch || contextDispatch;
  // Local value tracks the immediate DOM content
  const [localValue, setLocalValue] = useState(value);
  const innerRef = useRef<HTMLElement>(null);
  const cursorRef = useRef<number | null>(null);

  /* 
    Refactored Field Primitive (ContentEditable):
    - Unified Element (Span)
    - Chips/Mention Ready
  */

  const isActive =
    active !== undefined
      ? active
      : (name !== undefined && String(name) === String(currentFocusId)) ||
      (name !== undefined && String(name) === String(osFocusedItemId));

  // Sync prop value to local state
  useEffect(() => {
    if (!isComposingRef.current && value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  // Sync local state to DOM (Manual Control for ContentEditable)
  useLayoutEffect(() => {
    if (innerRef.current) {
      // Always sync innerText to localValue
      // We no longer rely on 'children' for placeholder text, so this is safe.
      if (innerRef.current.innerText !== localValue) {
        innerRef.current.innerText = localValue;

        // Restore cursor if active
        if (isActive && cursorRef.current !== null) {
          setCaretPosition(innerRef.current, cursorRef.current);
        }
      }
    }
  }, [localValue, isActive]);

  // Auto-focus and Cursor Restoration
  useEffect(() => {
    if (isActive && innerRef.current) {
      if (document.activeElement !== innerRef.current) {
        innerRef.current.focus();
      }

      // Restore Cursor specifically on Focus Gain
      if (cursorRef.current !== null) {
        // We need a slight delay to ensure browser focus behavior settles
        // especially if we are switching from inactive
        requestAnimationFrame(() => {
          if (innerRef.current && cursorRef.current !== null) {
            try {
              setCaretPosition(innerRef.current, cursorRef.current);
            } catch (e) { }
          }
        });
      }
    } else if (!isActive && blurOnInactive && innerRef.current && document.activeElement === innerRef.current) {
      innerRef.current.blur();
    }
  }, [isActive, blurOnInactive]);

  const commitChange = (currentText: string) => {
    if (innerRef.current) {
      cursorRef.current = getCaretPosition(innerRef.current);
    }

    if (commitCommand) {
      dispatch({
        ...commitCommand,
        payload: { ...commitCommand.payload, text: currentText },
      });
      return;
    }

    if (name) dispatch({ type: "PATCH", payload: { [name]: currentText } });
    else if (updateType) dispatch({ type: updateType, payload: { text: currentText } });
  };

  const isComposingRef = useRef(false);

  // --- Context Sensor Logic ---
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

  const { onKeyDown: externalKeyDown, ...otherProps } = rest as any;

  const handleInput = (e: FormEvent<HTMLElement>) => {
    const text = (e.currentTarget as HTMLElement).innerText;
    setLocalValue(text);
    updateCursorContext();

    if (syncCommand)
      dispatch({
        ...syncCommand,
        payload: { ...syncCommand.payload, text },
      });
    else if (name) dispatch({ type: "PATCH", payload: { [name]: text } });
    else if (updateType)
      dispatch({ type: updateType, payload: { text } });
  };

  const styles = isActive
    ? otherProps.className
    : `pointer-events-none truncate ${otherProps.className || ""}`;

  // Robust Placeholder using CSS pseudo-element
  // We use the 'empty' state of localValue to toggle the class.
  // This avoids reliance on :empty pseudo-class which can be flaky with <br>.
  const shouldShowPlaceholder = placeholder && !localValue;

  // Tailwind Arbitrary Value for content.
  // We apply it as a class.
  const placeholderClasses = shouldShowPlaceholder
    ? "before:content-[attr(data-placeholder)] before:text-gray-400 before:opacity-50 before:pointer-events-none before:absolute before:truncate max-w-full"
    : "";

  // Multiline vs Singleline styling
  // Single line needs 'whitespace-nowrap' or similar to prevent wrapping if user pastes?
  // AND usually overflow handling.
  // We add conditional classes.
  const lineClasses = multiline ? "whitespace-pre-wrap break-words" : "whitespace-nowrap overflow-hidden";
  const displayClasses = multiline ? "block" : "inline-block min-w-[1ch] max-w-full align-bottom";

  const baseProps = {
    ref: innerRef,
    contentEditable: isActive,
    suppressContentEditableWarning: true,
    role: "textbox",
    // aria-multiline for accessibility
    "aria-multiline": multiline,
    tabIndex: isActive ? 0 : -1,
    // Add relative to host to anchor the absolute placeholder
    className: `${styles} ${placeholderClasses} ${lineClasses} ${displayClasses} relative`.trim(),
    "data-placeholder": placeholder,

    // Always null, content controlled by useLayoutEffect
    children: null,

    onFocus: () => {
      // Guard circular focus
      if (name && currentFocusId !== name) {
        dispatch({ type: "SET_FOCUS", payload: { id: name } });
      }

      if (!contextService?.context.isFieldFocused) {
        updateContext({ isFieldFocused: true });
      }
      requestAnimationFrame(updateCursorContext);
    },
    onCompositionStart: () => { isComposingRef.current = true; },
    onCompositionEnd: () => { isComposingRef.current = false; },
    onInput: handleInput,
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
      if (e.nativeEvent.isComposing || isComposingRef.current) {
        // Stop propagation for all navigation keys during IME to protect Zone navigation
        if (["Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
          e.stopPropagation();
        }
        if (e.key === "Enter") e.preventDefault();
        return;
      }

      // COMMIT Logic (Enter)
      if (e.key === "Enter") {
        if (!multiline) {
          e.preventDefault(); // Prevent newline in single-line mode
          commitChange(localValue);
        } else {
          // Multiline: Allow default behavior (newline), OR Shift+Enter to commit?
          // Standard: Enter = Newline. Cmd+Enter = Commit.
          // User didn't specify, but usually we don't commit on plain Enter in textarea.
          // However, we need to stop propagation if we consume it, else global "Enter" might trigger something.
          e.stopPropagation();
        }
      }

      // NAVIGATION Logic (ArrowUp / ArrowDown)
      // If NOT multiline, we want standard OS focus navigation (Grid/List).
      // We allow the event to bubble up to the OS Key Listener.
      if (!multiline && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        // Explicitly do NOTHING here. Let it bubble.
        // Typically, browser might move caret to start/end. 
        // If we want to prevent caret movement and ONLY navigate, we might need preventDefault.
        // But often "Best Effort" is: let it bubble.
        // Warning: If OS listener works on "KeyDown", it will fire.
        // If OS listener checks `e.defaultPrevented`, we are good.
        // If browser default moves caret, it's fine as we are leaving the field anyway.
      } else if (multiline && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        // In multiline, we usually want internal caret navigation.
        // Be careful: if we are at top/bottom, should we bubble?
        // Standard Textarea behavior: consume unless at edge.
        // For now, let's stop propagation to keep focus inside the multiline field 
        // until user explicitly exits (e.g. via Escape or Tab).
        e.stopPropagation();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        // Always trap Horizontal Arrows for Caret Movement (Single & Multi)
        // Unless we want to implement "Cursor past end" logic later.
        e.stopPropagation();
      }

      if (externalKeyDown) externalKeyDown(e);
    },
    ...otherProps,
  };

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<any>;
    return cloneElement(child, {
      ...baseProps,
      className: `${baseProps.className} ${child.props.className || ""}`,
      onFocus: (e: any) => {
        child.props.onFocus?.(e);
        baseProps.onFocus();
      },
    });
  }

  // Unified Render
  return <span {...baseProps} />;
};
