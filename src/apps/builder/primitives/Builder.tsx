/**
 * Builder — Invisible annotation layer for CMS/Web Builder
 *
 * Delegates all focus behavior to OS.Item (official OS facade).
 * Builder components add only builder-specific annotations:
 *   - data-level: "section" | "group" | "item"
 *   - data-builder-id: unique builder element ID
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

import { OS } from "@os/AntigravityOS";
import { forwardRef, type ReactElement } from "react";

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
  const Component = forwardRef<HTMLElement, BuilderComponentProps>(
    function BuilderComponent({ id, children }, ref) {
      return (
        <OS.Item
          id={id}
          asChild
          ref={ref}
          data-level={level}
          data-builder-id={id}
          data-nav-skip={level !== "item" ? "true" : undefined}
        >
          {children}
        </OS.Item>
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
