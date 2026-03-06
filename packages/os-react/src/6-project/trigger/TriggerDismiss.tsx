/**
 * Trigger.Dismiss — Close the nearest overlay.
 *
 * Renders an Item inside the overlay zone. Activation (Enter/Click)
 * is handled by the overlay zone's onAction callback via OS pipeline.
 */

import type { BaseCommand } from "@kernel";
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
    children,
    className,
    id,
    ...rest
}: TriggerDismissProps & { id?: string }) {
    const overlayCtx = useOverlayContext();

    const itemId = id ?? `${overlayCtx?.overlayId ?? "dialog"}-dismiss`;

    return (
        <Item id={itemId} asChild>
            <button type="button" className={className} {...rest}>
                {children}
            </button>
        </Item>
    );
}

TriggerDismiss.displayName = "Trigger.Dismiss";
