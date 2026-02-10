import { InspectorStore } from "@os/inspector/InspectorStore";
import { TestBotActions } from "@os/testBot";
import { usePlaywrightSpecs } from "@os/testBot/playwright/loader";
import { TestGrid } from "../shared/TestLayout";
import { ActivateTest } from "./tests/ActivateTest";
import { AriaFacadeTest } from "./tests/AriaFacadeTest";
import { AriaInteractionTest } from "./tests/AriaInteractionTest";
import { AutofocusTest } from "./tests/AutofocusTest";
import { DismissTest } from "./tests/DismissTest";
import { ExpandTest } from "./tests/ExpandTest";
import { FocusStackTest } from "./tests/FocusStackTest";
import { NavigateTest } from "./tests/NavigateTest";
import { SelectTest } from "./tests/SelectTest";
import { TabTest } from "./tests/TabTest";

// Playwright spec
import runFocusShowcase from "../../../e2e/focus-showcase/focus-showcase.spec.ts";

export function FocusShowcasePage() {
  usePlaywrightSpecs("pw-focus-showcase", [runFocusShowcase]);

  const runAllTests = () => {
    InspectorStore.setOpen(true);
    InspectorStore.setActiveTab("TESTBOT");
    InspectorStore.setPanelExpanded(true);
    TestBotActions.runAll();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <header className="mb-6 px-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FocusGroup Strategy Audit
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Compact verification suite for Sense → Intent → Update → Commit →
            Sync pipeline.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={runAllTests}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
          >
            ▶ Run All Tests (Inspector)
          </button>
        </div>
      </header>

      <TestGrid>
        <AutofocusTest />
        <NavigateTest />
        <SelectTest />
        <TabTest />
        <ActivateTest />
        <DismissTest />
        <AriaFacadeTest />
        <AriaInteractionTest />
        <ExpandTest />
        <FocusStackTest />
      </TestGrid>
    </div>
  );
}

export default FocusShowcasePage;
