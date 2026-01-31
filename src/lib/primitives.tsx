import { createContext, useContext, cloneElement, isValidElement, useState, useEffect } from 'react'
import type { ReactNode, ReactElement, ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'

// Generic command type that primitives can work with
export interface BaseCommand {
    type: string;
    payload?: any;
}

export const CommandContext = createContext<(cmd: any) => void>(() => { })

interface ActionProps<T extends BaseCommand> {
    command: T
    children: ReactNode
    asChild?: boolean
}

export const Action = <T extends BaseCommand>({ command, children, asChild }: ActionProps<T>) => {
    const dispatch = useContext(CommandContext)
    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<any>;
        return cloneElement(child, {
            onClick: (e: any) => {
                child.props.onClick?.(e);
                dispatch(command);
            }
        })
    }
    return <button onClick={() => dispatch(command)}>{children}</button>
}

interface FieldProps<T extends BaseCommand> {
    value: string
    updateType?: string // Optional if using name
    name?: string       // Key to patch in state
    commitCommand?: T
    children?: ReactNode
    asChild?: boolean
}

export const Field = <T extends BaseCommand>({
    value,
    updateType,
    name,
    commitCommand,
    children,
    asChild
}: FieldProps<T>) => {
    const dispatch = useContext(CommandContext)
    const [localValue, setLocalValue] = useState(value)

    // Keep local state in sync with external value (e.g., when the draft is cleared after submit)
    useEffect(() => {
        setLocalValue(value)
    }, [value])

    const commitChange = (val: string) => {
        if (val === value) return // Skip if no real change
        if (name) {
            dispatch({ type: 'PATCH', payload: { [name]: val } })
        } else if (updateType) {
            dispatch({ type: updateType, payload: { text: val } })
        }
    }

    const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
        if (e.nativeEvent.isComposing) return
        if (e.key === 'Enter') {
            commitChange(localValue)
            if (commitCommand) {
                dispatch(commitCommand)
                setLocalValue('') // Clear local state immediately for UX and to handle batching
            }
        }
    }

    const baseProps = {
        value: localValue,
        onFocus: () => dispatch({ type: 'SET_FOCUS', payload: { id: 'DRAFT' } }),
        onChange: (e: ChangeEvent<HTMLInputElement>) => setLocalValue(e.target.value),
        onBlur: () => commitChange(localValue),
        onKeyDown: handleKeyDown
    }

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<any>;
        return cloneElement(child, baseProps)
    }
    return <input type="text" {...baseProps} />
}
