import type { ActivateConfig } from "./FocusActivateConfig.ts";
import { DEFAULT_ACTIVATE } from "./FocusActivateConfig.ts";
import type { DismissConfig } from "./FocusDismissConfig.ts";
import { DEFAULT_DISMISS } from "./FocusDismissConfig.ts";
import type { NavigateConfig } from "./FocusNavigateConfig.ts";
import { DEFAULT_NAVIGATE } from "./FocusNavigateConfig.ts";
import type { ProjectConfig } from "./FocusProjectConfig.ts";
import { DEFAULT_PROJECT } from "./FocusProjectConfig.ts";
import type { SelectConfig } from "./FocusSelectConfig.ts";
import { DEFAULT_SELECT } from "./FocusSelectConfig.ts";
import type { TabConfig } from "./FocusTabConfig.ts";
import { DEFAULT_TAB } from "./FocusTabConfig.ts";

export interface FocusGroupConfig {
  navigate: NavigateConfig;
  tab: TabConfig;
  select: SelectConfig;
  activate: ActivateConfig;
  dismiss: DismissConfig;
  project: ProjectConfig;
}

export const DEFAULT_CONFIG: FocusGroupConfig = {
  navigate: DEFAULT_NAVIGATE,
  tab: DEFAULT_TAB,
  select: DEFAULT_SELECT,
  activate: DEFAULT_ACTIVATE,
  dismiss: DEFAULT_DISMISS,
  project: DEFAULT_PROJECT,
};
