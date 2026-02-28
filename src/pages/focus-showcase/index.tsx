import { useEffect } from "react";
import { InspectorStore } from "@inspector/stores/InspectorStore";
import { TestBotRegistry } from "@os/testing";
import { focusShowcaseScripts } from "./focusScripts";
import { TestGrid } from "../shared/TestLayout";
import { ActivateTest } from "./tests/ActivateTest";
import { AriaFacadeTest } from "./tests/AriaFacadeTest";
import { AriaInteractionTest } from "./tests/AriaInteractionTest";
import { AutofocusTest } from "./tests/AutofocusTest";
import { DisabledTest } from "./tests/DisabledTest";
import { DismissTest } from "./tests/DismissTest";
import { ExpandTest } from "./tests/ExpandTest";
import { FocusStackTest } from "./tests/FocusStackTest";
import { NavigateTest } from "./tests/NavigateTest";
import { RadiogroupTest } from "./tests/RadiogroupTest";
import { SelectTest } from "./tests/SelectTest";
import { TabTest } from "./tests/TabTest";
import { TablistTest } from "./tests/TablistTest";
import { TypeaheadTest } from "./tests/TypeaheadTest";


export function FocusShowcasePage() {
  // Register focus-showcase scripts with TestBot on mount
  useEffect(() => {
    return TestBotRegistry.register(focusShowcaseScripts);
  }, []);

  const runAllTests = () => {
    InspectorStore.setOpen(true);
    InspectorStore.setPanelExpanded(true);
    InspectorStore.setActiveTab("TESTBOT");
  };


  return (
    <div className="min-h-screen text-gray-900 p-2">
      <header className="mb-1 px-2 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Focus Strategy Audit
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Full APG coverage · Ordered by specification section
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={runAllTests}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-1.5 rounded-lg font-bold text-xs shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
          >
            ▶ Run All Tests
          </button>
        </div>
      </header>

      <TestGrid>
        {/* §3.2 Entry & Navigate */}
        <AutofocusTest />
        <NavigateTest />
        <TypeaheadTest />
        <DisabledTest />

        {/* §3.3 Tab */}
        <TabTest />

        {/* §3.4 Selection */}
        <SelectTest />
        <RadiogroupTest />

        {/* §3.5 Interaction */}
        <ActivateTest />
        <DismissTest />

        {/* §3.6 Tablist */}
        <TablistTest />

        {/* §3.7 Expand */}
        <ExpandTest />

        {/* §3.1 Focus Stack */}
        <FocusStackTest />

        {/* §9 ARIA Verification */}
        <AriaFacadeTest />
        <AriaInteractionTest />
      </TestGrid>
    </div>
  );
}

export default FocusShowcasePage;
