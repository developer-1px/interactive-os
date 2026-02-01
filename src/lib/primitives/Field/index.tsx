import { useState, useRef, useEffect, isValidElement, cloneElement } from 'react';
import type { ReactNode, ReactElement, ChangeEvent, KeyboardEvent as ReactKeyboardEvent, InputHTMLAttributes } from 'react';
import { useCommandEngine } from '../CommandContext';
import { useContextService } from '../../context';
import type { BaseCommand } from '../types';

export interface FieldProps<T extends BaseCommand> extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'name' | 'onBlur' | 'onFocus'> {
    value: string
    active?: boolean
    autoFocus?: boolean
    updateType?: string
    name?: string
    commitCommand?: T
    syncCommand?: T
    cancelCommand?: T
    children?: ReactNode
    asChild?: boolean
    dispatch?: (cmd: any) => void
    commitOnBlur?: boolean
}

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
    dispatch: customDispatch,
    ...rest
}: FieldProps<T>) => {
    const { dispatch: contextDispatch, currentFocusId } = useCommandEngine()
    // Safe Context Usage: Check if we are inside a provider that supports updating context
    const contextService = useContextService();
    const updateContext = contextService?.updateContext || (() => { }); // Fallback

    const dispatch = customDispatch || contextDispatch
    const [localValue, setLocalValue] = useState(value)
    const innerRef = useRef<HTMLInputElement>(null)
    const cursorRef = useRef<{ start: number | null, end: number | null }>({ start: null, end: null })

    const isActive = active !== undefined ? active : (
        currentFocusId === name ||
        (name === 'draft' && String(currentFocusId).toLowerCase() === 'draft') ||
        (name === 'DRAFT' && String(currentFocusId).toUpperCase() === 'DRAFT')
    );

    useEffect(() => {
        if (!isComposingRef.current) {
            setLocalValue(value)
        }
    }, [value])

    // Auto-focus and Cursor Restoration
    useEffect(() => {
        if (isActive && innerRef.current) {
            if (document.activeElement === innerRef.current) {
                return;
            }

            innerRef.current.focus();

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
        }
    }, [isActive])

    const commitChange = (val: string) => {
        if (innerRef.current) {
            cursorRef.current = {
                start: innerRef.current.selectionStart,
                end: innerRef.current.selectionEnd
            };
        }

        if (commitCommand) {
            dispatch({ ...commitCommand, payload: { ...commitCommand.payload, text: val } });
            return;
        }
        if (val === value) return;
        if (name) dispatch({ type: 'PATCH', payload: { [name]: val } })
        else if (updateType) dispatch({ type: updateType, payload: { text: val } })
    }

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
            cursorAtEnd: start === innerRef.current.value.length && end === innerRef.current.value.length
        });
    };

    // Separate onKeyDown to allow correct composition
    const { onKeyDown: externalKeyDown, ...otherProps } = rest as any;

    const baseProps = {
        ref: innerRef,
        value: localValue,
        onFocus: () => {
            // console.log('Field: Setting focus to', name || 'DRAFT');
            dispatch({ type: 'SET_FOCUS', payload: { id: name || 'DRAFT' } });
            updateContext({ isFieldFocused: true });
            // Initial check on focus
            requestAnimationFrame(updateCursorContext);
        },
        onCompositionStart: handleCompositionStart,
        onCompositionEnd: handleCompositionEnd,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setLocalValue(val);
            // Sync cursor context immediately
            updateCursorContext();

            if (syncCommand) dispatch({ ...syncCommand, payload: { ...syncCommand.payload, text: val } });
            else if (name) dispatch({ type: 'PATCH', payload: { [name]: val } });
            else if (updateType) dispatch({ type: updateType, payload: { text: val } });

            // While typing, we are NOT at start unless empty (handled by next render/event usually, but good to check)
        },
        onSelect: updateCursorContext,
        onKeyUp: updateCursorContext,
        onClick: updateCursorContext,
        onBlur: () => {
            if (commitOnBlur) {
                commitChange(localValue);
            }
            updateContext({ isFieldFocused: false, cursorAtStart: false, cursorAtEnd: false });
        },
        onKeyDown: (e: ReactKeyboardEvent) => {
            // Priority: Internal Logic (Structure/Safety) -> External Logic (App Specific)

            // 1. Internal Safety
            if (e.nativeEvent.isComposing || isComposingRef.current) {
                // CRITICAL: Stop propagation so the Global Zone listener doesn't see 'Enter'
                // and trigger a duplicate AddTodo command.
                // ALSO: Stop propagation for navigation keys to prevent Sidebar jump or list navigation during composition.
                if (['Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.stopPropagation();
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                }
                // Allow arrows to move within composition
                return;
            }

            if (e.key === 'Enter') {
                e.stopPropagation();
                e.preventDefault();
                commitChange(localValue);
                // Don't return, let external handle if they want (though stopProp usually limits it)
            }

            // 2. Cancellation
            if (e.key === 'Escape' && cancelCommand) {
                e.stopPropagation();
                dispatch(cancelCommand);
            }

            // 3. External Handler
            if (externalKeyDown) {
                externalKeyDown(e);
            }

            // Note: We deliberately removed the 'ArrowLeft' trap. 
            // We let it bubble. Zone will check 'cursorAtStart' context and decide if it handles it.
        },
        ...otherProps
    }

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<any>;
        return cloneElement(child, {
            ...baseProps,
            onFocus: (e: any) => { child.props.onFocus?.(e); baseProps.onFocus(); }
        })
    }
    return <input type="text" {...baseProps} />
}
