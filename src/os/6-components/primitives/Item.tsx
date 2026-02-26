import { useFocusGroupContext } from "@os/6-components/base/FocusGroup.tsx";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";
import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  type ReactNode,

  useMemo,
} from "react";

// ═══════════════════════════════════════════════════════════════════
// ItemContext — parent Item identity for compound sub-components
// ═══════════════════════════════════════════════════════════════════

interface ItemContextValue {
  zoneId: string;
  itemId: string;
}

const ItemContext = createContext<ItemContextValue | null>(null);



// --- Types ---
interface ItemState {
  isFocused: boolean;
  isSelected: boolean;
  isExpanded: boolean;
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

const ItemBase = forwardRef<HTMLElement, ItemProps>(
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
    const isActive = os.useComputed((s) => s.os.focus.activeZoneId === zoneId);

    // Selection from kernel state
    const isStoreSelected = os.useComputed(
      (s) => s.os.focus.zones[zoneId]?.selection.includes(stringId) ?? false,
    );

    // Expanded from kernel state
    const isExpanded = os.useComputed(
      (s) =>
        s.os.focus.zones[zoneId]?.expandedItems.includes(stringId) ?? false,
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
        isExpanded,
        isAnchor,
      }),
      [isFocused, isSelected, isExpanded, isAnchor],
    );

    // Resolve Children
    const resolvedChildren: ReactNode =
      typeof children === "function" ? children(itemState) : children;

    return (
      <ItemContext.Provider value={{ zoneId, itemId: stringId }}>
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
      </ItemContext.Provider>
    );
  },
);

ItemBase.displayName = "Item";

// ═══════════════════════════════════════════════════════════════════
// Item.ExpandTrigger — sub-region click toggles parent Item's expand state
// Use case: arrow icon click ≠ label click (e.g. file manager tree)
// DocsSidebar uses whole-item click (OS_ACTIVATE → OS_EXPAND) instead.
// ═══════════════════════════════════════════════════════════════════

interface ExpandTriggerProps {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
}

function ItemExpandTrigger({
  children,
  asChild,
  className,
}: ExpandTriggerProps) {


  // PointerListener handles click → OS_EXPAND via data-expand-trigger attribute.
  // No React onClick needed.

  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    const mergedProps = {
      "data-expand-trigger": true,
      className:
        [child.props.className, className].filter(Boolean).join(" ") ||
        undefined,
    };
    return cloneElement(child, mergedProps);
  }

  return (
    <div data-expand-trigger className={className}>
      {children}
    </div>
  );
}

ItemExpandTrigger.displayName = "Item.ExpandTrigger";

// ═══════════════════════════════════════════════════════════════════
// Item.CheckTrigger — PointerListener dispatches OS_CHECK for parent Item
// ═══════════════════════════════════════════════════════════════════

interface CheckTriggerProps {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
}

function ItemCheckTrigger({ children, asChild, className }: CheckTriggerProps) {
  // PointerListener handles click → OS_CHECK via data-check-trigger attribute.
  // No React onClick needed.

  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return cloneElement(child, {
      "data-check-trigger": true,
      className:
        [child.props.className, className].filter(Boolean).join(" ") ||
        undefined,
    });
  }

  return (
    <div data-check-trigger className={className}>
      {children}
    </div>
  );
}

ItemCheckTrigger.displayName = "Item.CheckTrigger";

// ═══════════════════════════════════════════════════════════════════
// Namespace merge
// ═══════════════════════════════════════════════════════════════════

export const Item = Object.assign(ItemBase, {
  ExpandTrigger: ItemExpandTrigger,
  CheckTrigger: ItemCheckTrigger,
});
