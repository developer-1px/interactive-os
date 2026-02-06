/**
 * Zone - Facade for FocusGroup
 * 
 * Provides a simplified wrapper for FocusGroup.
 * Configuration is determined solely by the `role` prop - no manual overrides allowed.
 * This ensures consistent behavior across the application by design.
 */

import { FocusGroup } from '@os/features/focus/primitives/FocusGroup';
import type { ComponentProps, ReactNode } from 'react';

// Zone only exposes role-based configuration - no manual config overrides
export interface ZoneProps extends Omit<ComponentProps<'div'>, 'id' | 'role' | 'onSelect'> {
    /** Unique identifier for the zone */
    id?: string;
    /** @deprecated Use id instead */
    area?: string;
    /** ARIA role preset that determines all navigation/tab/select behavior */
    role?: string;
    /** Activation callback */
    onActivate?: (itemId: string) => void;
    /** Children */
    children: ReactNode;
}

export function Zone({ area, id, role, onActivate, children, ...props }: ZoneProps) {
    // Use id if present, otherwise fallback to area for legacy support
    const effectiveId = id || area;

    return (
        <FocusGroup
            id={effectiveId}
            role={role}
            onActivate={onActivate}
            {...props}
        >
            {children}
        </FocusGroup>
    );
}

// Re-export standard focus hooks and types for convenience
export * from '@os/features/focus/primitives/FocusGroup';

