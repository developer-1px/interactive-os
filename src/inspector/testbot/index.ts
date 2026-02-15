// ═══════════════════════════════════════════════════════════════════
// TestBot — Public API
// ═══════════════════════════════════════════════════════════════════

// Features (public API)
export { TestBotActions } from "./features/TestBotActions";
export { TestBotPanel } from "./widgets/TestBotPanel";

// Side-effect: global API
import "./features/globalApi";
