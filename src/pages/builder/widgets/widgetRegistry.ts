/**
 * Widget Registry — maps PrimitiveType to its widget component.
 *
 * OCP: new type = new entry here + new widget in PropertyWidgets.tsx.
 */

import type { PrimitiveType } from "@apps/builder/model/primitives";
import type { FC } from "react";
import {
  BadgeWidget,
  ButtonWidget,
  ColorWidget,
  DateWidget,
  IconWidget,
  ImageWidget,
  LinkWidget,
  MultilineWidget,
  NumberWidget,
  SelectWidget,
  TextWidget,
  ToggleWidget,
  type WidgetProps,
} from "./PropertyWidgets";

const widgetRegistry: Record<PrimitiveType, FC<WidgetProps>> = {
  text: TextWidget,
  multiline: MultilineWidget,
  button: ButtonWidget,
  link: LinkWidget,
  image: ImageWidget,
  icon: IconWidget,
  color: ColorWidget,
  badge: BadgeWidget,
  date: DateWidget,
  select: SelectWidget,
  toggle: ToggleWidget,
  number: NumberWidget,
};

/**
 * Get the widget component for a primitive type.
 * Falls back to TextWidget for unknown types.
 */
export function getWidget(type: PrimitiveType): FC<WidgetProps> {
  return widgetRegistry[type] ?? TextWidget;
}
