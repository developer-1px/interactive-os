import {
  useRef,
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
import { getCaretPosition } from "./fieldUtils";
import type { BaseCommand } from "@os/ui/types";
import { useFocusStore } from "@os/core/focus/focusStore";
import type { FocusTarget } from "@os/core/focus/behavior/behaviorResolver";

// Refactored Logic & Hooks
import {
  shouldActivateField,
  getFieldClasses,
  getCommitAction,
  getSyncAction,
} from "./fieldLogic";
import {
  useFieldState,
  useFieldDOMSync,
  useFieldFocus,
  useFieldContext,
} from "./useFieldHooks";

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

  // Focus Behavior
  target?: FocusTarget;
  controls?: string; // ID of the Zone this field controls (virtual focus)
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
  target = "real",
  controls,
  ...rest
}: FieldProps<T> & { blurOnInactive?: boolean }) => {
  // --- 1. Global Context & Store ---
  const { dispatch: contextDispatch, currentFocusId } = useCommandEngine();
  const osFocusedItemId = useFocusStore((s) => s.focusedItemId);
  const dispatch = customDispatch || contextDispatch;

  // --- 2. Refs & Local State ---
  const innerRef = useRef<HTMLElement>(null);
  const cursorRef = useRef<number | null>(null);

  // Use Custom Hook for State
  const { localValue, setLocalValue, isComposingRef } = useFieldState({ value });

  // Use Logic for Active State
  const isActive = shouldActivateField(
    active,
    name,
    currentFocusId,
    osFocusedItemId
  );

  // --- 3. Custom Hooks for Side Effects ---
  const { updateCursorContext, setFieldFocused } = useFieldContext(innerRef, cursorRef);

  // Sync DOM with local React state
  useFieldDOMSync({ innerRef, localValue, isActive, cursorRef });

  // Manage Physical Focus
  useFieldFocus({ innerRef, isActive, blurOnInactive, cursorRef });

  // --- 4. Event Handlers ---

  const commitChange = (currentText: string) => {
    if (innerRef.current) {
      cursorRef.current = getCaretPosition(innerRef.current);
    }

    const action = getCommitAction(currentText, commitCommand, name, updateType);
    if (action) {
      dispatch(action);
    }
  };

  const handleInput = (e: FormEvent<HTMLElement>) => {
    const text = (e.currentTarget as HTMLElement).innerText;
    setLocalValue(text);
    updateCursorContext();

    const action = getSyncAction(text, syncCommand, name, updateType);
    if (action) {
      dispatch(action);
    }
  };

  const handleFocus = () => {
    // Guard circular focus
    if (name && currentFocusId !== name) {
      dispatch({ type: "SET_FOCUS", payload: { id: name } });
    }

    setFieldFocused(true);
    requestAnimationFrame(updateCursorContext);
  };

  const handleBlur = () => {
    if (commitOnBlur) {
      commitChange(localValue);
    }
    setFieldFocused(false);
  };

  const { onKeyDown: externalKeyDown, className: customClassName, ...otherProps } = rest as any;

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.nativeEvent.isComposing || isComposingRef.current) {
      // Stop propagation for all navigation keys during IME
      if (["Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.stopPropagation();
      }
      if (e.key === "Enter") e.preventDefault();
      return;
    }

    // COMMIT Logic (Enter)
    if (e.key === "Enter") {
      if (!multiline) {
        e.preventDefault();
        commitChange(localValue);
      } else {
        e.stopPropagation();
      }
    }

    // NAVIGATION Logic
    if (!multiline && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      // Allow bubbling for OS navigation
    } else if (multiline && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.stopPropagation();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.stopPropagation();
    }

    if (externalKeyDown) externalKeyDown(e);
  };

  // --- 5. Rendering ---

  const composeProps = getFieldClasses({
    isActive,
    multiline,
    value: localValue,
    placeholder,
    customClassName
  });

  const baseProps = {
    ref: innerRef,
    contentEditable: isActive,
    suppressContentEditableWarning: true,
    role: "textbox",
    "aria-multiline": multiline,
    tabIndex: isActive ? 0 : -1,
    className: composeProps,
    "data-placeholder": placeholder,

    // Virtual Focus Attributes
    "aria-controls": controls,
    "aria-activedescendant": (target === "virtual" && controls && osFocusedItemId && osFocusedItemId !== name)
      ? osFocusedItemId
      : undefined,


    children: null, // content controlled by useFieldDOMSync

    onFocus: handleFocus,
    onCompositionStart: () => { isComposingRef.current = true; },
    onCompositionEnd: () => { isComposingRef.current = false; },
    onInput: handleInput,
    onSelect: updateCursorContext,
    onKeyUp: updateCursorContext,
    onClick: updateCursorContext,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
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

  return <span {...baseProps} />;
};
