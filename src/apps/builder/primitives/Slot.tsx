/**
 * Slot — Radix-style asChild primitive
 *
 * Renders NO DOM of its own. Instead, merges all props into
 * its single child element via cloneElement.
 */

import {
  type CSSProperties,
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

function setRef<T>(ref: Ref<T> | undefined, value: T) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T>).current = value;
  }
}

export function composeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T) =>
    refs.forEach((r) => {
      setRef(r, node);
    });
}

export function mergeProps(
  slotProps: Record<string, any>,
  childProps: Record<string, any>,
): Record<string, any> {
  const merged: Record<string, any> = { ...slotProps, ...childProps };

  if (slotProps["className"] || childProps["className"]) {
    merged["className"] =
      [slotProps["className"], childProps["className"]]
        .filter(Boolean)
        .join(" ") || undefined;
  }

  if (slotProps["style"] || childProps["style"]) {
    merged["style"] = {
      ...(slotProps["style"] as CSSProperties),
      ...(childProps["style"] as CSSProperties),
    };
  }

  return merged;
}

export interface SlotProps {
  children: ReactNode;
  [key: string]: any;
}

export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, ...slotProps },
  ref,
) {
  if (!isValidElement(children)) {
    return children as any;
  }

  const child = children as ReactElement<any>;
  const childRef = (child as any).ref;

  return cloneElement(
    child,
    mergeProps(slotProps, {
      ...child.props,
      ref: composeRefs(ref, childRef),
    }),
  );
});

Slot.displayName = "Slot";
