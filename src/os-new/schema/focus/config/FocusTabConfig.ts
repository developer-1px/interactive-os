export interface TabConfig {
    behavior: "trap" | "escape" | "flow";
    restoreFocus: boolean;
}

export const DEFAULT_TAB: TabConfig = {
    behavior: "flow",
    restoreFocus: false,
};
