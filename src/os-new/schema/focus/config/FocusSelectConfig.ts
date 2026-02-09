export interface SelectConfig {
  mode: "none" | "single" | "multiple";
  followFocus: boolean;
  disallowEmpty: boolean;
  range: boolean;
  toggle: boolean;
}

export const DEFAULT_SELECT: SelectConfig = {
  mode: "none",
  followFocus: false,
  disallowEmpty: false,
  range: false,
  toggle: false,
};
