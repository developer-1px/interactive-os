import { useContext, useRef, useEffect, isValidElement, cloneElement } from 'react';
import type { ReactNode, ReactElement } from 'react';
import { CommandContext } from '../CommandContext';

export interface OptionProps {
    id: string | number
    active?: boolean
    children: ReactNode
    asChild?: boolean
    dispatch?: (cmd: any) => void
    className?: string
}

export const Option = ({ id, active, children, asChild, dispatch: customDispatch, className }: OptionProps) => {
    const { dispatch: contextDispatch, currentFocusId } = useContext(CommandContext)
    const dispatch = customDispatch || contextDispatch
    const innerRef = useRef<HTMLDivElement>(null)

    const isActuallyActive = active !== undefined ? active : (currentFocusId === id);

    useEffect(() => {
        if (isActuallyActive && innerRef.current && document.activeElement !== innerRef.current) {
            innerRef.current.focus()
        }
    }, [isActuallyActive])

    const baseProps = {
        ref: innerRef,
        tabIndex: 0,
        onFocus: () => dispatch({ type: 'SET_FOCUS', payload: { id } }),
        onClick: (e: React.MouseEvent) => { e.stopPropagation(); dispatch({ type: 'SET_FOCUS', payload: { id } }); }
    }

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<any>
        return cloneElement(child, { ...baseProps, className: `${child.props.className || ''} ${className || ''}`.trim() })
    }
    return <div {...baseProps} className={className}>{children}</div>
}
