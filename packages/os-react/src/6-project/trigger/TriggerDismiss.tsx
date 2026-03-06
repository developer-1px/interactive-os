/**
 * Trigger.Dismiss — Close the nearest overlay.
 *
 * Uses Item + onActivate to dispatch OS_OVERLAY_CLOSE when
 * activated via Enter/Click.
 */

import type { BaseCommand } from "@kernel";
import { OS_OVERLAY_CLOSE } from "@os-core/4-command/overlay/overlay";
import { Item } from "@os-react/6-project/Item.tsx";
import type { ReactNode } from "react";
import { useOverlayContext } from "./OverlayContext";

export interface TriggerDismissProps
    extends React.HTMLAttributes<HTMLButtonElement> {
    /** Optional command to dispatch before closing */
    onActivate?: BaseCommand;
    /** Button content */
    children: ReactNode;
}

export function TriggerDismiss({
    onActivate,
    children,
    className,
    id,
    ...rest
}: TriggerDismissProps & { id?: string }) {
    const overlayCtx = useOverlayContext();

    const itemId = id ?? `${overlayCtx?.overlayId ?? "dialog"}-dismiss`;

    // Build the dismiss command for Item → ZoneRegistry → OS_ACTIVATE(Enter/Click)
    // When overlay exists, activation closes it.
    const dismissCmd = overlayCtx
        ? OS_OVERLAY_CLOSE({ id: overlayCtx.overlayId })
        : undefined;
    // If onActivate is provided, use it; otherwise use the dismiss command
    const activateCmd = onActivate ?? dismissCmd;

    return (
        <Item id={itemId} asChild onActivate={activateCmd}>
            <button type="button" className={className} {...rest}>
                {children}
            </button>
        </Item>
    );
}

TriggerDismiss.displayName = "Trigger.Dismiss";
