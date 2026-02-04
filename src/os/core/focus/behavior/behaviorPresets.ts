// ARIA Role Based Focus Behavior Presets
import type { FocusBehavior } from "./behaviorTypes";

export const FOCUS_PRESETS: Record<string, Partial<FocusBehavior>> = {
    dialog: {
        direction: "none",
        tab: "loop",
        entry: "first",
        restore: true
    },
    alertdialog: {
        direction: "none",
        tab: "loop",
        entry: "first",
        restore: true
    },
    listbox: {
        direction: "v",
        edge: "loop",
        tab: "escape",
        entry: "selected",
        restore: false
    },
    menu: {
        direction: "v",
        edge: "loop",
        tab: "escape",
        entry: "first",
        restore: true
    },
    menubar: {
        direction: "h",
        edge: "loop",
        tab: "escape",
        entry: "first",
        restore: false
    },
    tabs: {
        direction: "h",
        edge: "loop",
        tab: "escape",
        entry: "restore",
        restore: false
    },
    toolbar: {
        direction: "h",
        edge: "loop",
        tab: "escape",
        entry: "restore",
        restore: false
    },
    grid: {
        direction: "grid",
        edge: "stop",
        tab: "escape",
        entry: "restore",
        restore: true
    },
    tree: {
        direction: "v",
        edge: "loop",
        tab: "escape",
        entry: "restore",
        restore: false
    },
    combobox: {
        direction: "v",
        edge: "loop",
        tab: "escape",
        target: "virtual",
        entry: "first",
        restore: false
    },
    form: {
        direction: "none",
        tab: "flow",
        entry: "first",
        restore: false
    },
};
