export interface DismissConfig {
  escape: "close" | "deselect" | "none";
  outsideClick: "close" | "none";
}

export const DEFAULT_DISMISS: DismissConfig = {
  escape: "none",
  outsideClick: "none",
};
