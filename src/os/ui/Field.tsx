import {
  useRef,
  useState,
  useCallback,
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
import { useCommandListener } from "@os/core/command/useCommandListener";
import { OS_COMMANDS } from "@os/core/command/osCommands";
import { getCaretPosition } from "./fieldUtils";
import type { BaseCommand } from "@os/ui/types";
import { useFocusStore } from "@os/core/focus/focusStore";
import type { FocusTarget } from "@os/core/focus/behavior/behaviorTypes";

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

/** 
 * Field mode determines when editing is activated:
 * - "immediate": Focus triggers edit mode (default, current behavior)
 * - "deferred": Focus shows field, Enter triggers edit mode
 */
export type FieldMode = "immediate" | "deferred";

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

  // Field Mode
  mode?: FieldMode;

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
  mode = "immediate",
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

  // Deferred Mode: internal editing state
  const [isEditing, setIsEditing] = useState(false);

  // Refs for stable command handler access
  const valueRef = useRef(value);
  valueRef.current = value;
  const localValueRef = useRef("");

  // Use Custom Hook for State
  const { localValue, setLocalValue, isComposingRef } = useFieldState({ value });
  localValueRef.current = localValue;

  // Use Logic for Active State (is this field focused?)
  const isFocused = shouldActivateField(
    active,
    name,
    currentFocusId,
    osFocusedItemId
  );
  const isFocusedRef = useRef(false);
  isFocusedRef.current = isFocused;

  // Compute actual editability based on mode
  // - immediate: focus = edit
  // - deferred: focus + isEditing = edit
  const isContentEditable = mode === "deferred" ? (isFocused && isEditing) : isFocused;

  // Legacy alias for hooks that expect isActive
  const isActive = isContentEditable;

  // --- 3. Custom Hooks for Side Effects ---
  const { updateCursorContext, setFieldFocused } = useFieldContext(innerRef, cursorRef);

  // Sync DOM with local React state
  useFieldDOMSync({ innerRef, localValue, isActive, cursorRef });

  // Manage Physical Focus
  // Deferred mode: maintain DOM focus when isFocused (for Enter key reception)
  // Immediate mode: use isActive as before
  const shouldHaveDOMFocus = mode === "deferred" ? isFocused : isActive;
  useFieldFocus({ innerRef, isActive: shouldHaveDOMFocus, blurOnInactive, cursorRef });

  // Commit helper for command handlers
  const commitChangeForCommand = useCallback(() => {
    if (innerRef.current) {
      cursorRef.current = getCaretPosition(innerRef.current);
    }
    const action = getCommitAction(localValueRef.current, commitCommand, name, updateType);
    if (action) {
      dispatch(action);
    }
  }, [commitCommand, name, updateType, dispatch]);

  // --- 3.5 Command Listeners (Deferred Mode) ---
  // These respond to OS-level commands dispatched via keymap
  useCommandListener(mode === "deferred" ? [
    {
      command: OS_COMMANDS.FIELD_START_EDIT,
      handler: () => setIsEditing(true),
      when: () => isFocusedRef.current && !isEditing,
    },
    {
      command: OS_COMMANDS.FIELD_COMMIT,
      handler: () => {
        commitChangeForCommand();
        setIsEditing(false);
      },
      when: () => isFocusedRef.current && isEditing,
    },
    {
      command: OS_COMMANDS.FIELD_CANCEL,
      handler: () => {
        setLocalValue(valueRef.current);
        setIsEditing(false);
        if (cancelCommand) dispatch(cancelCommand);
      },
      when: () => isFocusedRef.current && isEditing,
    },
  ] : []);

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
    // Deferred mode: commit on blur if was editing
    if (mode === "deferred" && isEditing) {
      commitChange(localValue);
      setIsEditing(false);
    } else if (commitOnBlur) {
      commitChange(localValue);
    }
    setFieldFocused(false);
  };

  const { onKeyDown: externalKeyDown, className: customClassName, ...otherProps } = rest as any;

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    // IME Composition Guard
    if (e.nativeEvent.isComposing || isComposingRef.current) {
      if (["Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.stopPropagation();
      }
      if (e.key === "Enter") e.preventDefault();
      return;
    }

    // === DEFERRED MODE LOGIC ===
    // Field dispatches OS commands, which are received by useCommandListener
    if (mode === "deferred") {
      // Escape: Dispatch cancel command
      if (e.key === "Escape" && isEditing) {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: OS_COMMANDS.FIELD_CANCEL, payload: { fieldId: name } });
        return;
      }

      // Enter: Dispatch start or commit command
      if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        e.stopPropagation();

        if (!isEditing) {
          dispatch({ type: OS_COMMANDS.FIELD_START_EDIT, payload: { fieldId: name } });
        } else {
          dispatch({ type: OS_COMMANDS.FIELD_COMMIT, payload: { fieldId: name } });
        }
        return;
      }

      // Arrow keys: Only consume when editing
      if (!isEditing) {
        // Allow all navigation to bubble when not editing
        if (externalKeyDown) externalKeyDown(e);
        return;
      }
    }

    // === IMMEDIATE MODE & EDITING STATE LOGIC ===

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
    isFocused,
    multiline,
    value: localValue,
    placeholder,
    customClassName
  });

  // Deferred mode: tabIndex=0 when focused (even if not editing)
  // This allows the field to receive keyboard events for Enter-to-edit
  const computedTabIndex = mode === "deferred"
    ? (isFocused ? 0 : -1)
    : (isActive ? 0 : -1);

  const baseProps = {
    ref: innerRef,
    contentEditable: isContentEditable,
    suppressContentEditableWarning: true,
    role: "textbox",
    "aria-multiline": multiline,
    tabIndex: computedTabIndex,
    className: composeProps,
    "data-placeholder": placeholder,

    // Deferred Mode State Indicators
    "data-mode": mode,
    "data-editing": mode === "deferred" ? (isEditing ? "true" : undefined) : undefined,
    "data-focused": isFocused ? "true" : undefined,

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
