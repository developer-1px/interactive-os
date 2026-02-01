import { useContext, cloneElement, isValidElement } from 'react';
import type { ReactNode, ReactElement, MouseEvent as ReactMouseEvent } from 'react';
import { logger } from '../../logger';
import { CommandContext } from '../CommandContext';
import type { BaseCommand } from '../types';

export interface ActionProps<T extends BaseCommand> {
    command: T
    children: ReactNode
    asChild?: boolean
    dispatch?: (cmd: T) => void
    allowPropagation?: boolean
}

export const Action = <T extends BaseCommand>({ command, children, asChild, dispatch: customDispatch, allowPropagation = false }: ActionProps<T>) => {
    const { dispatch: contextDispatch } = useContext(CommandContext)
    const dispatch = customDispatch || contextDispatch

    const handleClick = (e: ReactMouseEvent) => {
        if (!allowPropagation) {
            e.stopPropagation()
        }
        logger.debug('PRIMITIVE', `Action Clicked: [${command.type}]`);
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
