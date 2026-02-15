import { InspectorStore } from "@inspector/stores/InspectorStore";
import { TestBotActions } from "@inspector/testbot";
import { usePlaywrightSpecs } from "@inspector/testbot/playwright/loader";
import { TestGrid } from "../shared/TestLayout";
import { ActivateTest } from "./tests/ActivateTest";
import { AriaFacadeTest } from "./tests/AriaFacadeTest";
import { AriaInteractionTest } from "./tests/AriaInteractionTest";
import { AutofocusTest } from "./tests/AutofocusTest";
import { DismissTest } from "./tests/DismissTest";
import { ExpandTest } from "./tests/ExpandTest";
// @ts-expect-error — spec-wrapper plugin transforms at build time
import runFocusShowcase from "./tests/e2e/focus-showcase.spec.ts";
import { FocusStackTest } from "./tests/FocusStackTest";
import { NavigateTest } from "./tests/NavigateTest";
import { SelectTest } from "./tests/SelectTest";
import { TabTest } from "./tests/TabTest";

// ═══════════════════════════════════════════════════════════════════
// Section Header — groups related test boxes visually
// ═══════════════════════════════════════════════════════════════════
function SectionHeader({
  spec,
  title,
  count,
}: {
  spec: string;
  title: string;
  count: number;
}) {
  return (
    <div className="col-span-full flex items-center gap-3 pt-2">
      <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
        {spec}
      </span>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </span>
      <span className="text-[10px] text-gray-400">
        {count} {count === 1 ? "test box" : "test boxes"}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export function FocusShowcasePage() {
  usePlaywrightSpecs("focus-showcase", [runFocusShowcase]);
  const runAllTests = () => {
    InspectorStore.setOpen(true);
    InspectorStore.setActiveTab("TESTBOT");
    InspectorStore.setPanelExpanded(true);
    TestBotActions.runAll();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <header className="mb-2 px-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Focus Strategy Audit
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            SPEC §3–§9 coverage · 26 E2E tests · Ordered by specification
            section
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={runAllTests}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
          >
            ▶ Run All Tests
          </button>
        </div>
      </header>

      <TestGrid>
        {/* ═══ §3.2 Entry & Navigate ═══ */}
        <SectionHeader spec="§3.2" title="Entry & Navigation" count={2} />
        <AutofocusTest />
        <NavigateTest />

        {/* ═══ §3.4 Selection ═══ */}
        <SectionHeader spec="§3.4" title="Selection" count={1} />
        <SelectTest />

        {/* ═══ §3.3 Tab ═══ */}
        <SectionHeader spec="§3.3" title="Tab Behavior" count={1} />
        <TabTest />

        {/* ═══ §3.5 Interaction ═══ */}
        <SectionHeader spec="§3.5" title="Interaction" count={2} />
        <ActivateTest />
        <DismissTest />

        {/* ═══ §3.7 Expand ═══ */}
        <SectionHeader spec="§3.7" title="Expand / Collapse" count={1} />
        <ExpandTest />

        {/* ═══ §3.1 Focus Stack ═══ */}
        <SectionHeader spec="§3.1" title="Focus Stack" count={1} />
        <FocusStackTest />

        {/* ═══ §9 ARIA Verification ═══ */}
        <SectionHeader spec="§9" title="ARIA Verification" count={2} />
        <AriaFacadeTest />
        <AriaInteractionTest />
      </TestGrid>
    </div>
  );
}

export default FocusShowcasePage;
