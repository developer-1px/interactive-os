import type { Orientation } from "../FocusDirection.ts";

export interface NavigateConfig {
    orientation: Orientation;
    loop: boolean;
    seamless: boolean;
    typeahead: boolean;
    entry: "first" | "last" | "restore" | "selected";
    recovery: "next" | "prev" | "nearest";
}

export const DEFAULT_NAVIGATE: NavigateConfig = {
    orientation: "vertical",
    loop: false,
    seamless: false,
    typeahead: false,
    entry: "first",
    recovery: "next",
};
