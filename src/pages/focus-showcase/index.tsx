import { TestGrid } from "../shared/TestLayout";
import { NavigateTest } from "./tests/NavigateTest";
import { SelectTest } from "./tests/SelectTest";
import { TabTest } from "./tests/TabTest";
import { ActivateTest } from "./tests/ActivateTest";
import { DismissTest } from "./tests/DismissTest";
import { AutofocusTest } from "./tests/AutofocusTest";
import { AriaFacadeTest } from "./tests/AriaFacadeTest";
import { AriaInteractionTest } from "./tests/AriaInteractionTest";
import { ExpandTest } from "./tests/ExpandTest";

export function FocusShowcasePage() {
    const runAllTests = async () => {
        // Trigger click on all RUN buttons sequentially
        const buttons = document.querySelectorAll('[data-test-run]');
        for (const btn of buttons) {
            if (btn instanceof HTMLButtonElement) {
                btn.click();
                await new Promise(r => setTimeout(r, 1000)); // Wait for each test
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
            <header className="mb-6 px-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        FocusGroup Strategy Audit
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Compact verification suite for Sense → Intent → Update → Commit → Sync pipeline.
                    </p>
                </div>
                <button
                    onClick={runAllTests}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/40"
                >
                    ▶ Run All Tests
                </button>
            </header>

            <TestGrid>
                <NavigateTest />
                <SelectTest />
                <TabTest />
                <ActivateTest />
                <DismissTest />
                <AutofocusTest />
                <AriaFacadeTest />
                <AriaInteractionTest />
                <ExpandTest />
            </TestGrid>
        </div>
    );
}

export default FocusShowcasePage;
