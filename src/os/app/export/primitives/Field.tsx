import {
  useRef,
  useState,
  useCallback,
  isValidElement,
  cloneElement,
  useLayoutEffect,
} from "react";
import type {
  ReactNode,
  ReactElement,
  KeyboardEvent as ReactKeyboardEvent,
  HTMLAttributes,
  FormEvent,
} from "react";
import { useCommandEngine } from "@os/features/command/ui/CommandContext.tsx";
import { useCommandListener } from "@os/features/command/hooks/useCommandListener";
import { OS_COMMANDS } from "@os/features/command/definitions/osCommands.ts";
import { getCaretPosition } from "../../../features/input/ui/Field/getCaretPosition";
import type { BaseCommand } from "@os/entities/BaseCommand.ts";
// [NEW] Local Store & Global Registry
import { useFocusGroupStore, useFocusGroupContext } from "@os/features/focus/primitives/FocusGroup";
// import { useFocusRegistry } from "@os/features/focusGroup/registry/FocusRegistry";
import type { FocusTarget } from "@os/entities/FocusTarget.ts";

// Refactored Logic & Hooks
import {
  shouldActivateField,
  getFieldClasses,
  getCommitAction,
  getSyncAction,
} from "../../../features/input/ui/Field/fieldLogic.ts";
import {
  useFieldState,
  useFieldDOMSync,
  useFieldFocus,
  useFieldContext,
} from "../../../features/input/ui/Field/useFieldHooks.ts";
import { DOMRegistry } from "@os/features/focus/registry/DOMRegistry.ts";

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

  // Callbacks for local state
  onCommit?: (value: string) => void;
  onSync?: (value: string) => void;
  onCancel?: () => void;

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
  onCommit,
  onSync,
  onCancel,
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
  // Get store instance
  const store = useFocusGroupStore();
  const osFocusedItemId = store(s => s.focusedItemId);
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

  // Zone context is needed before DOM registration
  const focusContext = useFocusGroupContext();
  const zoneId = focusContext?.zoneId || "unknown";

  // [NEW] DOM Registry Registration
  useLayoutEffect(() => {
    if (name && innerRef.current) {
      DOMRegistry.registerItem(name, zoneId, innerRef.current);
    }
    return () => {
      if (name) DOMRegistry.unregisterItem(name);
    };
  }, [name, zoneId]);

  // --- Zone Registration (like Item does) ---
  const addItem = store((s) => s.addItem);
  const removeItem = store((s) => s.removeItem);

  useLayoutEffect(() => {
    if (name && addItem && zoneId && zoneId !== "unknown") {
      addItem(name); // Just name (id)
      return () => { if (removeItem) removeItem(name); }
    }
  }, [name, zoneId, addItem, removeItem]);

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
    const val = localValueRef.current;
    onCommit?.(val);
    const action = getCommitAction(val, commitCommand, name, updateType);
    if (action) {
      dispatch(action);
    }
  }, [commitCommand, name, updateType, dispatch, onCommit]);

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
        onCancel?.();
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

    // Callback-first: if onCommit is provided, use it as primary commit mechanism
    if (onCommit) {
      onCommit(currentText);
      return; // Skip command dispatch when callback is provided
    }

    // Fallback to command dispatch
    const action = getCommitAction(currentText, commitCommand, name, updateType);
    if (action) {
      dispatch(action);
    }
  };

  const handleInput = (e: FormEvent<HTMLElement>) => {
    const text = (e.currentTarget as HTMLElement).innerText;
    setLocalValue(text);
    updateCursorContext();

    // Callback-first: if onSync is provided, use it as primary sync mechanism
    if (onSync) {
      onSync(text);
      return; // Skip command dispatch when callback is provided
    }

    // Fallback to command dispatch
    const action = getSyncAction(text, syncCommand, name, updateType);
    if (action) {
      dispatch(action);
    }
  };

  const handleFocus = () => {
    // Guard circular focus - use OS focus store directly
    const setFocus = store.getState().setFocus;
    if (name && osFocusedItemId !== name) {
      setFocus(name);
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

  // Deferred mode: tabIndex controlled by OS focus (roving tabindex pattern)
  // Immediate mode: tabIndex=0 always so browser Tab works natively (for tab="flow" zones)
  const computedTabIndex = mode === "deferred"
    ? (isFocused ? 0 : -1)
    : 0;

  const baseProps = {
    ref: innerRef,
    id: name, // Ensure the element has an id for DOMRegistry
    "data-item-id": name, // Essential for FocusBridge to detect native focus
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
