/**
 * Zone - Facade for FocusGroup
 * 
 * Provides a dedicated wrapper for FocusGroup to allow for future 
 * Zone-specific functionality and facade logic.
 */

import { FocusGroup, type FocusGroupProps } from '@os/features/focus/primitives/FocusGroup';

export interface ZoneProps extends FocusGroupProps {
    /** Area identifier for scoped commands (maps to id if provided) */
    area?: string;
}

export function Zone({ area, id, ...props }: ZoneProps) {
    // Use id if present, otherwise fallback to area for legacy support
    const effectiveId = id || area;

    return <FocusGroup id={effectiveId} {...props} />;
}

// Re-export standard focus hooks and types for convenience
export * from '@os/features/focus/primitives/FocusGroup';
