/**
 * Zone - Facade for FocusGroup
 * 
 * Provides a simplified wrapper for FocusGroup.
 * Configuration is primarily determined by the `role` prop.
 * Use `options` for advanced per-instance overrides when needed.
 */

import { FocusGroup } from '@os/features/focus/primitives/FocusGroup';
import type { BaseCommand } from '@os/entities/BaseCommand';
import type { ComponentProps, ReactNode } from 'react';
import type {
    NavigateConfig,
    TabConfig,
    SelectConfig,
    ActivateConfig,
    DismissConfig,
    ProjectConfig,
} from '@os/features/focus/types';

/** Advanced configuration overrides - use sparingly, prefer role presets */
export interface ZoneOptions {
    navigate?: Partial<NavigateConfig>;
    tab?: Partial<TabConfig>;
    select?: Partial<SelectConfig>;
    activate?: Partial<ActivateConfig>;
    dismiss?: Partial<DismissConfig>;
    project?: Partial<ProjectConfig>;
}

// Zone only exposes role-based configuration - no manual config overrides
export interface ZoneProps extends Omit<ComponentProps<'div'>, 'id' | 'role' | 'onSelect'> {
    /** Unique identifier for the zone */
    id?: string;
    /** @deprecated Use id instead */
    area?: string;
    /** ARIA role preset that determines all navigation/tab/select behavior */
    role?: string;
    /** Advanced config overrides (use sparingly) */
    options?: ZoneOptions;
    /** Command dispatched on item activation (Enter key) */
    bindActivateCommand?: BaseCommand;
    /** Command dispatched on item selection (Space key) */
    bindSelectCommand?: BaseCommand;
    /** Children */
    children: ReactNode;
}

export function Zone({ area, id, role, options, bindActivateCommand, bindSelectCommand, children, ...props }: ZoneProps) {
    // Use id if present, otherwise fallback to area for legacy support
    const effectiveId = id || area;

    return (
        <FocusGroup
            id={effectiveId}
            role={role}
            navigate={options?.navigate}
            tab={options?.tab}
            select={options?.select}
            activate={options?.activate}
            dismiss={options?.dismiss}
            project={options?.project}
            bindActivateCommand={bindActivateCommand}
            bindSelectCommand={bindSelectCommand}
            {...props}
        >
            {children}
        </FocusGroup>
    );
}

// Re-export standard focus hooks and types for convenience
export * from '@os/features/focus/primitives/FocusGroup';
