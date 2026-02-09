import type { FocusIntent } from "./FocusIntent.ts";

export interface PipelineContext {
    // Source
    readonly sourceId: string | null;
    readonly sourceGroupId: string | null;

    // Intent
    readonly intent: FocusIntent;

    // Resolution
    targetId: string | null;
    targetGroupId: string | null;

    // Spatial Memory
    stickyX: number | null;
    stickyY: number | null;

    // Flags
    shouldTrap: boolean;
    shouldProject: boolean;

    // Selection
    newSelection?: string[];
    newAnchor?: string | null;

    // Activation
    activated?: boolean;
}
