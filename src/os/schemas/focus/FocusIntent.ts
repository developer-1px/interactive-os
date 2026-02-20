import type { Direction, TabDirection } from "./FocusDirection.ts";

export type FocusIntent =
  | { type: "OS_NAVIGATE"; direction: Direction }
  | { type: "OS_TAB"; direction: TabDirection }
  | {
      type: "OS_SELECT";
      mode: "single" | "toggle" | "range" | "all" | "none";
      targetId?: string;
    }
  | {
      type: "OS_ACTIVATE";
      targetId?: string;
      trigger: "enter" | "space" | "click" | "focus";
    }
  | { type: "DISMISS"; reason: "escape" | "outsideClick" }
  | { type: "OS_FOCUS"; targetId: string; source?: "pointer" | "manual" | "auto" }
  | {
      type: "POINTER";
      subtype: "enter" | "leave" | "down" | "up";
      targetId: string;
    }
  | {
      type: "OS_EXPAND";
      action: "toggle" | "expand" | "collapse";
      targetId?: string;
    };
