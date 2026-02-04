import type { ZoneMetadata } from "./ZoneMetadata";

// Moved from src/os/core/focus/focusTypes.ts
export interface FocusObject {
    id: string;
    index: number;
    payload: any;
    group: {
        id: string; // Zone ID
        metadata?: ZoneMetadata;
    };
}
