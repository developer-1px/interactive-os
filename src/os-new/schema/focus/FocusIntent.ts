import type { Direction, TabDirection } from "./FocusDirection.ts";

export type FocusIntent =
    | { type: "NAVIGATE"; direction: Direction }
    | { type: "TAB"; direction: TabDirection }
    | {
        type: "SELECT";
        mode: "single" | "toggle" | "range" | "all" | "none";
        targetId?: string;
    }
    | {
        type: "ACTIVATE";
        targetId?: string;
        trigger: "enter" | "space" | "click" | "focus";
    }
    | { type: "DISMISS"; reason: "escape" | "outsideClick" }
    | { type: "FOCUS"; targetId: string; source?: "pointer" | "manual" | "auto" }
    | {
        type: "POINTER";
        subtype: "enter" | "leave" | "down" | "up";
        targetId: string;
    }
    | {
        type: "EXPAND";
        action: "toggle" | "expand" | "collapse";
        targetId?: string;
    };
