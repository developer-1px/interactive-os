export interface ActivateConfig {
    mode: "manual" | "automatic";
}

export const DEFAULT_ACTIVATE: ActivateConfig = {
    mode: "manual",
};
