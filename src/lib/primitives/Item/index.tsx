import { useRef, useEffect, isValidElement, cloneElement } from 'react';
import type { ReactNode, ReactElement } from 'react';
import { useCommandEngine } from '../CommandContext';

export interface ItemProps {
    id: string | number
    active?: boolean
    children: ReactNode
    asChild?: boolean
    dispatch?: (cmd: any) => void
    className?: string
}

export const Item = ({ id, active, children, asChild, dispatch: customDispatch, className }: ItemProps) => {
    const { dispatch: contextDispatch, currentFocusId } = useCommandEngine()
    const dispatch = customDispatch || contextDispatch
    const innerRef = useRef<HTMLDivElement>(null)

    const isActuallyActive = active !== undefined ? active : (String(currentFocusId) === String(id));

    useEffect(() => {
        if (isActuallyActive && innerRef.current) {
            // Prevent stealing focus if a child (like an Input Field) already has it
            if (innerRef.current.contains(document.activeElement)) {
                return;
            }
            if (document.activeElement !== innerRef.current) {
                innerRef.current.focus()
            }
        }
    }, [isActuallyActive])

    const baseProps = {
        ref: innerRef,
        tabIndex: 0,
        "data-active": isActuallyActive,
        onFocus: () => dispatch({ type: 'SET_FOCUS', payload: { id } }),
        onClick: (e: React.MouseEvent) => { e.stopPropagation(); dispatch({ type: 'SET_FOCUS', payload: { id } }); }
    }

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<any>
        return cloneElement(child, { ...baseProps, className: `outline-none ${child.props.className || ''} ${className || ''}`.trim() })
    }
    return <div {...baseProps} className={`outline-none ${className || ''}`.trim()}>{children}</div>
}
