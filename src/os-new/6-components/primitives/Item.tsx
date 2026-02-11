import { forwardRef, isValidElement, type ReactNode, useMemo } from "react";
import { kernel } from "@os/kernel.ts";
import { useFocusGroupContext } from "@os/6-components/base/FocusGroup.tsx";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";

// --- Types ---
interface ItemState {
  isFocused: boolean;
  isSelected: boolean;
  isAnchor?: boolean;
}

export interface ItemProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "id" | "children"> {
  id: string | number;

  // Data Binding
  payload?: any;
  index?: number;

  // Visuals (Polymorphic)
  children: ReactNode | ((state: ItemState) => ReactNode);
  asChild?: boolean;
  className?: string;

  // Overrides
  selected?: boolean;
}

export const Item = forwardRef<HTMLElement, ItemProps>(
  (
    {
      id,
      children,
      asChild,
      className,
      payload,
      index = 0,
      selected = false,
      ...rest
    },
    ref,
  ) => {
    const stringId = String(id);

    // --- Context Access ---
    const context = useFocusGroupContext();
    const zoneId = context?.zoneId || "unknown";

    // --- State (Kernel Direct) ---
    const focusedItemId = kernel.useComputed(
      (s) => s.os.focus.zones[zoneId]?.focusedItemId ?? null,
    );
    const activeZoneId = kernel.useComputed((s) => s.os.focus.activeZoneId);

    const isActive = activeZoneId === zoneId;
    const isFocused = focusedItemId === stringId;

    // Selection from kernel state
    const isStoreSelected = kernel.useComputed(
      (s) => s.os.focus.zones[zoneId]?.selection.includes(stringId) ?? false,
    );

    // Anchor Logic
    const isAnchor = isFocused && !isActive;

    // Combined selection: prop OR store
    const isSelected = selected || isStoreSelected;

    // State for Render Props
    const itemState: ItemState = useMemo(
      () => ({
        isFocused: isFocused && isActive,
        isSelected,
        isAnchor,
      }),
      [isFocused, isActive, isSelected, isAnchor],
    );

    // Resolve Children
    let resolvedChildren = children;
    if (typeof children === "function") {
      resolvedChildren = children(itemState);
    }

    return (
      <FocusItem
        id={stringId}
        ref={ref}
        asChild={
          asChild ||
          (typeof children === "function" && isValidElement(resolvedChildren))
        }
        className={className}
        data-selected={isSelected ? "true" : undefined}
        {...rest}
      >
        {resolvedChildren}
      </FocusItem>
    );
  },
);

Item.displayName = "Item";
