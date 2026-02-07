// ═══════════════════════════════════════════════════════════════════
// TestBot — Public API
// ═══════════════════════════════════════════════════════════════════

// Entities
export type { TestBot } from "./entities/TestBot";
export type { TestActions, Expectations, KeyModifiers } from "./entities/TestActions";
export type { StepResult } from "./entities/StepResult";
export type { SuiteResult, SuiteStatus, OnProgress, OnStep } from "./entities/SuiteResult";
export type { BotCursor, BubbleVariant } from "./entities/BotCursor";

// Features (public API)
export { TestBotActions } from "./features/TestBotActions";
export { useTestBotStore } from "./features/TestBotStore";
export { useTestBotRoutes } from "./features/useTestBotRoutes";

// Widgets
export { TestBotPanel } from "./widgets/TestBotPanel";

// Side-effect: global API
import "./features/globalApi";
