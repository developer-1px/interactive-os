import { FocusData } from "@os/features/focus/lib/focusData";
import {
  forwardRef,
  isValidElement,
  type ReactNode,
  useMemo,
  useSyncExternalStore,
} from "react";
import { useStore } from "zustand";
import {
  useFocusGroupContext,
  useFocusGroupStore,
} from "@/os-new/primitives/FocusGroup";
import { FocusItem } from "@/os-new/primitives/FocusItem";

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

    // Selection from store (OS-level selection via Shift+Arrow, Cmd+A)
    const storeSelection = useStore(store, (s) => s.selection);
    const isStoreSelected = storeSelection?.includes(stringId) ?? false;

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
