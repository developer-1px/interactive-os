import { useFocusGroupContext } from "@os/6-components/base/FocusGroup.tsx";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";
import { os } from "@os/kernel.ts";
import { forwardRef, isValidElement, type ReactNode, useMemo } from "react";

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
  payload?: unknown;
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
    // Subscribe to booleans, not raw IDs — avoids re-render of all items
    // when focus moves from one item to another.
    const isFocused = os.useComputed(
      (s) => (s.os.focus.zones[zoneId]?.focusedItemId ?? null) === stringId,
    );
    const isActive = os.useComputed(
      (s) => s.os.focus.activeZoneId === zoneId,
    );

    // Selection from kernel state
    const isStoreSelected = os.useComputed(
      (s) => s.os.focus.zones[zoneId]?.selection.includes(stringId) ?? false,
    );

    // Anchor: focused but zone is inactive (retained focus)
    const isAnchor = isFocused && !isActive;

    // Combined selection: prop OR store
    const isSelected = selected || isStoreSelected;

    // State for Render Props
    // isFocused is always true when this item is the zone's focused item,
    // regardless of whether the zone is active. Use isAnchor to distinguish.
    const itemState: ItemState = useMemo(
      () => ({
        isFocused,
        isSelected,
        isAnchor,
      }),
      [isFocused, isSelected, isAnchor],
    );

    // Resolve Children
    const resolvedChildren: ReactNode =
      typeof children === "function" ? children(itemState) : children;

    return (
      <FocusItem
        id={stringId}
        ref={ref}
        asChild={
          asChild ||
          (typeof children === "function" &&
            isValidElement(resolvedChildren) &&
            typeof resolvedChildren.type === "string")
        }
        {...(className !== undefined ? { className } : {})}
        data-selected={isSelected ? "true" : undefined}
        _isFocusedHint={isFocused}
        _isActiveHint={isActive}
        {...(rest as any)}
      >
        {resolvedChildren}
      </FocusItem>
    );
  },
);

Item.displayName = "Item";
