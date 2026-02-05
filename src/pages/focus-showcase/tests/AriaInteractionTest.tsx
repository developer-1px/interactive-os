import { useState } from "react";
import { FocusGroup } from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import { Trigger } from "@os/app/export/primitives/Trigger";
import { Field } from "@os/app/export/primitives/Field";
import { TestBox, useTestState } from "../../shared/TestLayout";
import { click, assert, wait } from "../../shared/testUtils";

export function AriaInteractionTest() {
    const { status, setStatus, logs, addLog, clearLogs } = useTestState();
    const [actionCount, setActionCount] = useState(0);

    const runTest = async () => {
        setStatus('running');
        clearLogs();
        const localLogs: string[] = [];

        try {
            // ═══════════════════════════════════════════════════════════════
            // 1. TRIGGER Action Test
            // ═══════════════════════════════════════════════════════════════
            localLogs.push('→ Testing Trigger Action...');

            // Click the trigger
            // NOTE: Trigger primitive listens to React/DOM onClick. 
            // testUtils.click() simulates OS commands (FOCUS/SELECT) which doesn't fire onClick.
            // We must simulate a real user interaction here.
            const btn = document.getElementById('test-trigger-btn');
            if (btn) {
                btn.click();
            } else {
                throw new Error('Trigger button not found');
            }
            await wait(100);

            // Verify action occurred (state update)
            // Note: We need to access the updated state. 
            // Since click() is async simulation, we wait a bit.
            const triggerBtn = document.getElementById('test-trigger-btn');
            assert(triggerBtn?.getAttribute('data-clicked') === 'true', 'Trigger dispatched command', localLogs);

            // ═══════════════════════════════════════════════════════════════
            // 2. SELECTION Test (Zone + Item)
            // ═══════════════════════════════════════════════════════════════
            localLogs.push('→ Testing Selection...');

            // Click Item 2
            click('#test-select-2');
            await wait(100);

            const item2 = document.getElementById('test-select-2');
            assert(item2?.getAttribute('aria-selected') === 'true', 'Item 2 selected', localLogs);
            assert(item2?.getAttribute('aria-current') === 'true', 'Item 2 focused', localLogs);

            // ═══════════════════════════════════════════════════════════════
            // 3. FIELD Input Test
            // ═══════════════════════════════════════════════════════════════
            localLogs.push('→ Testing Field Focus...');

            // Click Field
            click('#test-field-input');
            await wait(100);

            const field = document.getElementById('test-field-input');
            assert(field?.getAttribute('data-focused') === 'true', 'Field is focused', localLogs);

            setStatus('pass');
        } catch (e: any) {
            localLogs.push(`❌ ${e.message}`);
            setStatus('fail');
        } finally {
            localLogs.forEach(addLog);
        }
    };

    const description = (
        <div className="space-y-2">
            <p>
                Verifies interaction primitives:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li><strong>Trigger</strong>: Dispatches commands on click/Enter.</li>
                <li><strong>Selection</strong>: <code>aria-selected</code> via Zone configuration.</li>
                <li><strong>Field</strong>: Input focus and activation.</li>
            </ul>
        </div>
    );

    // Mock Command for Trigger
    const mockCommand = {
        type: 'TEST_ACTION',
        payload: { id: 'test-trigger' }
    };

    // Custom dispatch for the test trigger to update DOM for assertion
    const handleTriggerDispatch = () => {
        const btn = document.getElementById('test-trigger-btn');
        if (btn) btn.setAttribute('data-clicked', 'true');
        setActionCount(c => c + 1);
    };

    return (
        <TestBox title="ARIA Interactions" status={status} logs={logs} onRun={runTest} description={description}>
            <div className="flex flex-col gap-4">

                {/* 1. Trigger Section */}
                <div className="border p-2 rounded bg-gray-50">
                    <div className="text-[10px] font-mono text-gray-500 mb-2 uppercase">Trigger (Button)</div>
                    <Trigger
                        id="test-trigger-btn"
                        command={mockCommand}
                        dispatch={handleTriggerDispatch}
                        className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-100 active:bg-gray-200 text-sm"
                    >
                        Click Me ({actionCount})
                    </Trigger>
                </div>

                {/* 2. Selection Section */}
                <div className="border p-2 rounded bg-gray-50">
                    <div className="text-[10px] font-mono text-gray-500 mb-2 uppercase">Selection (Listbox)</div>
                    <FocusGroup
                        id="test-select-group"
                        role="listbox"
                        navigate={{ orientation: 'vertical' }}
                        select={{ mode: 'single' }}
                        className="flex flex-col gap-1"
                    >
                        {['Item 1', 'Item 2', 'Item 3'].map((text, i) => (
                            <FocusItem
                                key={i}
                                id={`test-select-${i + 1}`}
                                role="option"
                                className="px-2 py-1 bg-white border border-gray-200 rounded text-sm cursor-pointer aria-[selected=true]:bg-blue-50 aria-[selected=true]:border-blue-300 aria-[current=true]:ring-1 ring-blue-400"
                            >
                                {text}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </div>

                {/* 3. Field Section */}
                <div className="border p-2 rounded bg-gray-50">
                    <div className="text-[10px] font-mono text-gray-500 mb-2 uppercase">Field (Input)</div>
                    <Field
                        name="test-field-input"
                        value=""
                        placeholder="Focus me..."
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm focus:outline-none data-[focused=true]:border-blue-500 data-[focused=true]:ring-1 ring-blue-500"
                    />
                </div>

            </div>
        </TestBox>
    );
}
