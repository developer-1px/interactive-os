import { useContext, useState, useRef, useEffect, isValidElement, cloneElement } from 'react';
import type { ReactNode, ReactElement, ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { CommandContext } from '../CommandContext';
import type { BaseCommand } from '../types';

export interface FieldProps<T extends BaseCommand> {
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
}

export const Field = <T extends BaseCommand>({
    value,
    active,
    autoFocus,
    updateType,
    name,
    commitCommand,
    syncCommand,
    cancelCommand,
    children,
    asChild,
    dispatch: customDispatch
}: FieldProps<T>) => {
    const { dispatch: contextDispatch, currentFocusId } = useContext(CommandContext)
    const dispatch = customDispatch || contextDispatch
    const [localValue, setLocalValue] = useState(value)
    const innerRef = useRef<HTMLInputElement>(null)

    const isActive = active !== undefined ? active : (currentFocusId === 'DRAFT' || currentFocusId === name);

    useEffect(() => { setLocalValue(value) }, [value])
    useEffect(() => {
        if (isActive && innerRef.current && document.activeElement !== innerRef.current) {
            innerRef.current.focus()
        }
    }, [isActive])

    const commitChange = (val: string) => {
        if (commitCommand) {
            dispatch({ ...commitCommand, payload: { ...commitCommand.payload, text: val } });
            return;
        }
        if (val === value) return;
        if (name) dispatch({ type: 'PATCH', payload: { [name]: val } })
        else if (updateType) dispatch({ type: updateType, payload: { text: val } })
    }

    const baseProps = {
        ref: innerRef,
        value: localValue,
        onFocus: () => dispatch({ type: 'SET_FOCUS', payload: { id: name || 'DRAFT' } }),
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setLocalValue(val);
            if (syncCommand) dispatch({ ...syncCommand, payload: { ...syncCommand.payload, text: val } });
            else if (name) dispatch({ type: 'PATCH', payload: { [name]: val } });
            else if (updateType) dispatch({ type: updateType, payload: { text: val } });
        },
        onBlur: () => commitChange(localValue),
        onKeyDown: (e: ReactKeyboardEvent) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'Enter') {
                e.stopPropagation();
                e.preventDefault(); // Prevent FocusZone listener from firing
                commitChange(localValue);
            }
            if (e.key === 'Escape' && cancelCommand) { e.stopPropagation(); dispatch(cancelCommand); }
        }
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
