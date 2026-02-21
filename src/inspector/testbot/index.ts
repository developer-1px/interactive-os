// ═══════════════════════════════════════════════════════════════════
// TestBot — Public API
// ═══════════════════════════════════════════════════════════════════

// Features (public API)
export { TestBotActions } from "./features/TestBotActions";
export { TestBotPanel } from "./widgets/TestBotPanel";
export { TestBotV2Panel } from "./widgets/TestBotV2Panel";

// Side-effect: global API
import "./features/globalApi";
