/**
 * Item — DOM Adapter.
 *
 * computeItem() is the Single Source of Truth (headless.ts).
 * This component only does what requires a DOM:
 *   ① useComputed bitmask — trigger React re-render
 *   ② computeItem() — get attrs + state from headless
 *   ③ .focus() — DOM API
 *   ④ Render — JSX
 */

import { computeItem, type ItemState } from "@os/headless/compute";
import { os } from "@os/kernel.ts";
import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { DEFAULT_CONFIG } from "../../schemas";
import { useZoneContext } from "./Zone.tsx";

// Re-export for consumers
export type { ItemState } from "@os/headless/compute";

// ═══════════════════════════════════════════════════════════════════
// Props — what the DOM consumer provides
// ═══════════════════════════════════════════════════════════════════

export interface ItemProps
  extends Omit<
    React.HTMLAttributes<HTMLElement>,
    "id" | "children" | "className" | "style" | "role"
  > {
  id: string | number;
  disabled?: boolean;
  children: ReactNode | ((state: ItemState) => ReactNode);
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "li" | "button" | "a" | "span";
  asChild?: boolean;
  role?: string;
  onActivate?: import("@kernel").BaseCommand | undefined;
  selected?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Ref utils
// ═══════════════════════════════════════════════════════════════════

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => refs.forEach((r) => setRef(r, node));
}

// ═══════════════════════════════════════════════════════════════════
// Component — DOM-only adapter
// ═══════════════════════════════════════════════════════════════════

const ItemBase = forwardRef<HTMLElement, ItemProps>(
  function Item(
    {
      id,
      disabled,
      selected,
      role,
      children,
      className,
      style,
      as: Element = "div",
      asChild = false,
      onActivate,
      ...rest
    },
    ref,
  ) {
    const stringId = String(id);
    const ctx = useZoneContext();
    if (!ctx) throw new Error("Item must be used within a Zone");
    const { zoneId, config = DEFAULT_CONFIG } = ctx;

    // ① Re-render trigger (bitmask → primitive → stable ===)
    os.useComputed((s) => {
      const z = s.os.focus.zones[zoneId];
      return (
        (z?.focusedItemId === stringId ? 1 : 0) |
        (s.os.focus.activeZoneId === zoneId ? 2 : 0) |
        (z?.selection.includes(stringId) ? 4 : 0) |
        (z?.expandedItems.includes(stringId) ? 8 : 0)
      );
    });

    // ② Single Source of Truth
    const { attrs, state } = computeItem(os, stringId, zoneId, {
      disabled,
      selected,
      role,
    });

    // ③ DOM focus effect
    const internalRef = useRef<HTMLElement>(null);
    useLayoutEffect(() => {
      if (config.project.virtualFocus) return;
      if (state.isActiveFocused && internalRef.current) {
        if (document.activeElement !== internalRef.current) {
          internalRef.current.focus({ preventScroll: true });
        }
      }
    }, [state.isActiveFocused, config.project.virtualFocus]);

    // ④ Render
    const resolved: ReactNode =
      typeof children === "function" ? children(state) : children;

    const domProps = {
      ...attrs,
      className: className || undefined,
      style: style || undefined,
      ...rest,
    };

    // asChild / auto-asChild
    const childEl =
      asChild && isValidElement(resolved)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (resolved as ReactElement<any>)
        : null;

    const autoAsChild =
      !asChild &&
      typeof children === "function" &&
      isValidElement(resolved) &&
      typeof resolved.type === "string";

    const mergeEl = childEl
      ? childEl
      : autoAsChild
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (resolved as ReactElement<any>)
        : null;

    const combinedRef = useMemo(
      () =>
        composeRefs(
          ref,
          internalRef,
          (mergeEl as ReactElement & { ref?: React.Ref<HTMLElement> })?.ref,
        ),
      [ref, mergeEl],
    );

    if (mergeEl) {
      return cloneElement(mergeEl, {
        ...domProps,
        ref: combinedRef,
        className: [mergeEl.props.className, className]
          .filter(Boolean)
          .join(" ") || undefined,
        style: { ...mergeEl.props.style, ...style },
      });
    }

    return (
      <Element ref={combinedRef} {...domProps}>
        {resolved}
      </Element>
    );
  },
);

ItemBase.displayName = "Item";

// ═══════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════

function ItemExpandTrigger({
  children,
  asChild,
  className,
}: {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  if (asChild && isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const child = children as React.ReactElement<any>;
    return cloneElement(child, {
      "data-expand-trigger": true,
      className:
        [child.props.className, className].filter(Boolean).join(" ") ||
        undefined,
    });
  }
  return (
    <div data-expand-trigger className={className}>
      {children}
    </div>
  );
}

function ItemCheckTrigger({
  children,
  asChild,
  className,
}: {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  if (asChild && isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// ═══════════════════════════════════════════════════════════════════
// Namespace merge
// ═══════════════════════════════════════════════════════════════════

export const Item = Object.assign(ItemBase, {
  ExpandTrigger: ItemExpandTrigger,
  CheckTrigger: ItemCheckTrigger,
});
