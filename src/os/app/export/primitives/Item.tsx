import { FocusData } from "@os/features/focus/lib/focusData";
import {
  useFocusGroupContext,
  useFocusGroupStore,
} from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import {
  forwardRef,
  isValidElement,
  type ReactNode,
  useMemo,
  useSyncExternalStore,
} from "react";
import { useStore } from "zustand";

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

    // --- Store Access (for Render Props) ---
    const store = useFocusGroupStore();
    const context = useFocusGroupContext();
    const groupId = context?.groupId || "unknown";

    // Using Zustand Selector for granular updates
    const focusedItemId = useStore(store, (s) => s.focusedItemId);
    const activeGroupId = useSyncExternalStore(
      FocusData.subscribeActiveZone,
      () => FocusData.getActiveZoneId(),
      () => null,
    );

    const isActive = activeGroupId === groupId;
    const isFocused = focusedItemId === stringId;

    // Anchor Logic
    const isAnchor = isFocused && !isActive;

    // State for Render Props
    const itemState: ItemState = useMemo(
      () => ({
        isFocused: isFocused && isActive,
        isSelected: selected,
        isAnchor,
      }),
      [isFocused, isActive, selected, isAnchor],
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
        data-selected={selected ? "true" : undefined}
        {...rest}
      >
        {resolvedChildren}
      </FocusItem>
    );
  },
);

Item.displayName = "Item";
