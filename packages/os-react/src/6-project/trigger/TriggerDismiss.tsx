/**
 * Trigger.Dismiss — Close the nearest overlay.
 *
 * Renders an Item inside the overlay zone. Activation (Enter/Click)
 * dispatches onActivate via ZoneRegistry item callback → OS_ACTIVATE chain.
 */

import type { BaseCommand } from "@kernel";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { Item } from "@os-react/6-project/Item.tsx";
import { useZoneContext } from "@os-react/6-project/Zone.tsx";
import type { ReactNode } from "react";
import { useEffect } from "react";
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
  onActivate,
  ...rest
}: TriggerDismissProps & { id?: string }) {
  const overlayCtx = useOverlayContext();
  const zoneCtx = useZoneContext();
  const zoneId = zoneCtx?.zoneId;

  const itemId = id ?? `${overlayCtx?.overlayId ?? "dialog"}-dismiss`;

  useEffect(() => {
    if (!onActivate) return;
    const targetZoneId = zoneId ?? overlayCtx?.overlayId ?? "__standalone__";
    ZoneRegistry.setItemCallback(targetZoneId, itemId, { onActivate });
    return () => ZoneRegistry.clearItemCallback(targetZoneId, itemId);
  }, [itemId, onActivate, zoneId, overlayCtx?.overlayId]);

  return (
    <Item id={itemId} asChild>
      <button type="button" className={className} {...rest}>
        {children}
      </button>
    </Item>
  );
}

TriggerDismiss.displayName = "Trigger.Dismiss";
