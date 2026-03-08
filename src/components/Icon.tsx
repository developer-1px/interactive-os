/**
 * Centralized Icon Component
 *
 * Usage: <Icon name="folder" size={16} />
 *
 * This component provides a unified interface for using Lucide icons,
 * eliminating naming conflicts from direct imports.
 *
 * Registry data (icons, IconName, iconNames) lives in ./iconRegistry.ts
 * to satisfy react-refresh (only components exported from .tsx files).
 */

import type { LucideIcon } from "lucide-react";
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { type IconName, icons } from "./iconRegistry";

export type { IconName };
export { iconNames, icons } from "./iconRegistry";

export interface IconProps
  extends Omit<ComponentPropsWithoutRef<"svg">, "ref"> {
  /** Icon name from the registry */
  name: IconName;
  /** Icon size in pixels (default: 16) */
  size?: number;
  /** Stroke width (default: 2) */
  strokeWidth?: number;
}

/**
 * Centralized Icon component that renders Lucide icons by name.
 * Avoids import naming conflicts by providing a unified interface.
 *
 * @example
 * <Icon name="folder" size={16} />
 * <Icon name="file-text" size={20} className="text-gray-500" />
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = 16, strokeWidth = 2, className, ...props }, ref) => {
    const IconComponent = icons[name] as LucideIcon;

    if (!IconComponent) {
      console.warn(`Icon "${name}" not found in registry`);
      return null;
    }

    return (
      <IconComponent
        ref={ref}
        size={size}
        strokeWidth={strokeWidth}
        className={className}
        {...props}
      />
    );
  },
);

Icon.displayName = "Icon";

export default Icon;
