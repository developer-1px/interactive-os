// ═══════════════════════════════════════════════════════════════════
// TestBot — Public API
// ═══════════════════════════════════════════════════════════════════

export type { BotCursor, BubbleVariant } from "./entities/BotCursor";
export type { StepResult } from "./entities/StepResult";
export type {
  OnProgress,
  OnStep,
  SuiteResult,
  SuiteStatus,
} from "./entities/SuiteResult";
export type {
  ElementQuery,
  Expectations,
  KeyModifiers,
  Selector,
  TestActions,
} from "./entities/TestActions";
// Entities
export type { TestBot } from "./entities/TestBot";

// Features (public API)
export { TestBotActions } from "./features/TestBotActions";
export { useTestBotStore } from "./features/TestBotStore";
export { useTestBotRoutes } from "./features/useTestBotRoutes";

// Widgets
export { TestBotPanel } from "./widgets/TestBotPanel";

// Side-effect: global API
import "./features/globalApi";
