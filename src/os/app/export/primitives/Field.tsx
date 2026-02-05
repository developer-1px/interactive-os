import {
  useRef,
  useState,
  useCallback,
  forwardRef,
} from "react";
import type {
  ReactNode,
  KeyboardEvent as ReactKeyboardEvent,
  HTMLAttributes,
  FormEvent,
} from "react";
import { useCommandEngine } from "@os/features/command/ui/CommandContext.tsx";
import { useCommandListener } from "@os/features/command/hooks/useCommandListener";
import { OS_COMMANDS } from "@os/features/command/definitions/osCommands.ts";
import { getCaretPosition } from "../../../features/input/ui/Field/getCaretPosition";
import type { BaseCommand } from "@os/entities/BaseCommand.ts";
import { useFocusGroupStore, useFocusGroupContext } from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import { useFocusRegistry } from "@os/features/focus/registry/FocusRegistry";
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
  onCommit?: (value: string) => void;
  onSync?: (value: string) => void;
  onCancel?: () => void;
  mode?: FieldMode;
  target?: FocusTarget;
  controls?: string;
}

export const Field = forwardRef<HTMLElement, FieldProps<any> & { blurOnInactive?: boolean }>(({
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
}, ref) => {
  const { dispatch: contextDispatch } = useCommandEngine();
  const store = useFocusGroupStore();
  const context = useFocusGroupContext();
  const activeGroupId = useFocusRegistry(s => s.activeGroupId);

  const osFocusedItemId = store(s => s.focusedItemId);
  const dispatch = customDispatch || contextDispatch;
  const groupId = context?.groupId || "unknown";

  const innerRef = useRef<HTMLElement>(null);
  const cursorRef = useRef<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const valueRef = useRef(value);
  valueRef.current = value;
  const localValueRef = useRef("");

  const { localValue, setLocalValue, isComposingRef } = useFieldState({ value });
  localValueRef.current = localValue;

  // Determination of focusing
  const isSystemActive = activeGroupId === groupId;
  const isFocused = shouldActivateField(
    active,
    name,
    isSystemActive ? osFocusedItemId : null, // Only active if system matches
    osFocusedItemId
  );

  const isFocusedRef = useRef(false);
  isFocusedRef.current = isFocused;

  const isContentEditable = mode === "deferred" ? (isFocused && isEditing) : isFocused;
  const isActive = isContentEditable;

  const { updateCursorContext, setFieldFocused } = useFieldContext(innerRef, cursorRef);

  // Sync DOM with local React state
  useFieldDOMSync({ innerRef, localValue, isActive, cursorRef });

  const shouldHaveDOMFocus = mode === "deferred" ? isFocused : isActive;
  useFieldFocus({ innerRef, isActive: shouldHaveDOMFocus, blurOnInactive, cursorRef });

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

  const commitChange = (currentText: string) => {
    if (innerRef.current) {
      cursorRef.current = getCaretPosition(innerRef.current);
    }
    if (onCommit) {
      onCommit(currentText);
      return;
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

    if (onSync) {
      onSync(text);
      return;
    }

    const action = getSyncAction(text, syncCommand, name, updateType);
    if (action) {
      dispatch(action);
    }
  };

  const handleFocus = () => {
    const setFocus = store.getState().setFocus;
    if (name && osFocusedItemId !== name) {
      setFocus(name);
    }

    setFieldFocused(true);
    requestAnimationFrame(updateCursorContext);
  };

  const handleBlur = () => {
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
    if (e.nativeEvent.isComposing || isComposingRef.current) {
      if (["Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.stopPropagation();
      }
      if (e.key === "Enter") e.preventDefault();
      return;
    }

    if (mode === "deferred") {
      if (e.key === "Escape" && isEditing) {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: OS_COMMANDS.FIELD_CANCEL, payload: { fieldId: name } });
        return;
      }

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

      if (!isEditing) {
        if (externalKeyDown) externalKeyDown(e);
        return;
      }
    }

    if (e.key === "Enter") {
      if (!multiline) {
        e.preventDefault();
        commitChange(localValue);
      } else {
        e.stopPropagation();
      }
    }

    if (!multiline && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
    } else if (multiline && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.stopPropagation();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.stopPropagation();
    }

    if (externalKeyDown) externalKeyDown(e);
  };

  const composeProps = getFieldClasses({
    isActive,
    isFocused,
    multiline,
    value: localValue,
    placeholder,
    customClassName
  });

  // All Fields should be tab-navigable; focus state is managed by OS, not browser tabIndex
  const computedTabIndex = 0;

  const baseProps = {
    // ID is required for FocusItem registration
    id: name || "unknown-field",
    contentEditable: isContentEditable,
    suppressContentEditableWarning: true,
    role: "textbox",
    "aria-multiline": multiline,
    tabIndex: computedTabIndex,
    className: composeProps,
    "data-placeholder": placeholder,
    "data-mode": mode,
    "data-editing": mode === "deferred" ? (isEditing ? "true" : undefined) : undefined,
    "data-focused": isFocused ? "true" : undefined,
    "aria-controls": controls,
    "aria-activedescendant": (target === "virtual" && controls && osFocusedItemId && osFocusedItemId !== name)
      ? osFocusedItemId
      : undefined,

    // Controlled by useFieldDOMSync
    children: null,

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

  // We loop refs to internalRef and external ref
  const setInnerRef = (node: HTMLElement | null) => {
    (innerRef as any).current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as any).current = node;
  };

  if (!name) {
    console.warn("Field component missing 'name' prop, focus registration will fail.");
  }

  return (
    <FocusItem
      id={name || "unnamed-field"}
      as="span"
      ref={setInnerRef}
      {...baseProps}
    />
  );
});

Field.displayName = "Field";
