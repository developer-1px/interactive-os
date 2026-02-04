// Moved from src/os/core/focus/focusTypes.ts
export interface NavResult {
    targetId: string | null;
    zoneId: string | null;
    stickyX: number | null;
    stickyY: number | null;
    shouldTrap: boolean;
}
