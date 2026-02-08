/**
 * Builder — Invisible annotation layer for CMS/Web Builder
 *
 * Builder components NEVER create DOM nodes. They use Slot internally,
 * merging props (data-level, focus state) into the child element.
 *
 * Three levels:
 *   Builder.Section  → data-level="section"  (Hero, News, Services)
 *   Builder.Group    → data-level="group"    (Card, Tab group, Panel)
 *   Builder.Item     → data-level="item"     (Field, Image, Icon, Button, Badge)
 *
 * Usage:
 *   <Builder.Section asChild id="hero">
 *     <div className="bg-white py-24">
 *       <Builder.Item asChild id="hero-title">
 *         <Field value={title} ... />
 *       </Builder.Item>
 *     </div>
 *   </Builder.Section>
 */

import { FocusData } from "@os/features/focus/lib/focusData";
import { useFocusGroupContext } from "@os/features/focus/primitives/FocusGroup";
import { composeRefs, Slot } from "@os/lib/Slot";
import {
  forwardRef,
  type ReactElement,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export type BuilderLevel = "section" | "group" | "item";

interface BuilderComponentProps {
  /** Must be true — Builder components are asChild-only (no wrapper DOM) */
  asChild: true;
  /** Unique identifier */
  id: string;
  /** Single child element to merge into */
  children: ReactElement;
}

// ═══════════════════════════════════════════════════════════════════
// createBuilderComponent — Factory for Section/Group/Item
// ═══════════════════════════════════════════════════════════════════

function createBuilderComponent(level: BuilderLevel, displayName: string) {
  /** Inner component — only rendered inside a FocusGroup (hooks are safe here) */
  function BuilderFocusItem({
    id,
    innerRef,
    combinedRef,
    groupId,
    store,
    children,
  }: {
    id: string;
    innerRef: React.RefObject<HTMLElement | null>;
    combinedRef: (node: any) => void;
    groupId: string;
    store: any;
    children: ReactElement;
  }) {
    const activeGroupId = useSyncExternalStore(
      FocusData.subscribeActiveZone,
      () => FocusData.getActiveZoneId(),
      () => null,
    );

    const { isFocused, isSelected } = useStore(
      store,
      useShallow((state: any) => ({
        isFocused: state.focusedItemId === id,
        isSelected: state.selection.includes(id),
      })),
    );

    const isGroupActive = activeGroupId === groupId;
    const visualFocused = isFocused && isGroupActive;
    const isAnchor = isFocused && !isGroupActive;

    useLayoutEffect(() => {
      if (visualFocused && innerRef.current) {
        if (document.activeElement !== innerRef.current) {
          innerRef.current.focus({ preventScroll: true });
        }
      }
    }, [visualFocused, innerRef]);

    return (
      <Slot
        ref={combinedRef}
        id={id}
        tabIndex={visualFocused ? 0 : -1}
        data-level={level}
        data-builder-id={id}
        data-focus-item={true}
        data-item-id={id}
        data-anchor={isAnchor || undefined}
        data-focused={visualFocused || undefined}
        data-selected={isSelected || undefined}
        style={{ outline: "none" }}
      >
        {children}
      </Slot>
    );
  }

  const Component = forwardRef<HTMLElement, BuilderComponentProps>(
    function BuilderComponent({ id, children }, ref) {
      const ctx = useFocusGroupContext();
      const internalRef = useRef<HTMLElement>(null);
      const combinedRef = composeRefs(ref, internalRef);

      // Outside FocusGroup — just annotate with data attributes
      if (!ctx) {
        return (
          <Slot
            ref={combinedRef}
            id={id}
            data-level={level}
            data-builder-id={id}
          >
            {children}
          </Slot>
        );
      }

      return (
        <BuilderFocusItem
          id={id}
          innerRef={internalRef}
          combinedRef={combinedRef}
          groupId={ctx.groupId}
          store={ctx.store}
        >
          {children}
        </BuilderFocusItem>
      );
    },
  );

  Component.displayName = displayName;
  return Component;
}

// ═══════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════

const Section = createBuilderComponent("section", "Builder.Section");
const Group = createBuilderComponent("group", "Builder.Group");
const Item = createBuilderComponent("item", "Builder.Item");

import { BuilderBadge } from "./BuilderBadge";
import { BuilderButton } from "./BuilderButton";
import { BuilderDivider } from "./BuilderDivider";
import { BuilderIcon } from "./BuilderIcon";
// --- Universal Design Primitives ---
import { BuilderImage } from "./BuilderImage";
import { BuilderLink } from "./BuilderLink";

export const Builder = {
  Section,
  Group,
  Item,
  // Universal primitives
  Image: BuilderImage,
  Icon: BuilderIcon,
  Button: BuilderButton,
  Link: BuilderLink,
  Badge: BuilderBadge,
  Divider: BuilderDivider,
} as const;
