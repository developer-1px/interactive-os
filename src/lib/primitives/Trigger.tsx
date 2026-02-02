import { cloneElement, isValidElement } from 'react';
import type { ReactNode, ReactElement, MouseEvent as ReactMouseEvent } from 'react';
import { logger } from '../logger';
import { useCommandEngine } from './CommandContext';
import type { BaseCommand } from './types';

export interface TriggerProps<T extends BaseCommand> {
    command: T
    children: ReactNode
    asChild?: boolean
    dispatch?: (cmd: T) => void
    allowPropagation?: boolean
}

export const Trigger = <T extends BaseCommand>({ command, children, asChild, dispatch: customDispatch, allowPropagation = false }: TriggerProps<T>) => {
    const { dispatch: contextDispatch } = useCommandEngine()
    const dispatch = customDispatch || contextDispatch

    const handleClick = (e: ReactMouseEvent) => {
        if (!allowPropagation) {
            e.stopPropagation()
        }
        logger.debug('PRIMITIVE', `Trigger Clicked: [${command.type}]`);
        dispatch(command)
    }

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<any>;
        return cloneElement(child, {
            onClick: (e: any) => {
                child.props.onClick?.(e);
                handleClick(e);
            }
        })
    }
    return <button onClick={handleClick}>{children}</button>
}
