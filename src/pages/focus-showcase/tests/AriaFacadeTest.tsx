import { FocusGroup } from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import { TestBox, useTestState } from "../shared/TestLayout";
import { click, navigate, assert, wait } from "../shared/testUtils";

export function AriaFacadeTest() {
    const { status, setStatus, logs, addLog, clearLogs } = useTestState();

    const runTest = async () => {
        setStatus('running');
        clearLogs();
        const localLogs: string[] = [];

        try {
            // Test 1: Tabs ARIA Verification
            click('#aria-tab-1');
            await wait(100);

            const tab1 = document.getElementById('aria-tab-1');
            assert(tab1?.getAttribute('role') === 'tab', 'Tab 1 has correct role', localLogs);
            assert(tab1?.getAttribute('aria-selected') === 'true', 'Tab 1 is selected (simulated)', localLogs);
            assert(tab1?.getAttribute('aria-controls') === 'panel-1', 'Tab 1 controls correct panel', localLogs);
            assert(tab1?.getAttribute('aria-current') === 'true', 'Tab 1 is focused initially', localLogs);

            navigate('RIGHT');
            await wait(100);
            const tab2 = document.getElementById('aria-tab-2');
            assert(tab2?.getAttribute('aria-current') === 'true', 'Tab 2 is focused', localLogs);

            // Test 2: Radiogroup Verification
            click('#aria-radio-b');
            await wait(100);

            navigate('DOWN');
            await wait(100);
            const radioC = document.getElementById('aria-radio-c');
            assert(radioC?.getAttribute('role') === 'radio', 'Radio C has correct role', localLogs);
            assert(radioC?.getAttribute('aria-checked') === 'false', 'Radio C is visually unchecked', localLogs);

            // Test 3: Listbox Facade
            const listbox = document.getElementById('aria-listbox');
            assert(listbox?.getAttribute('role') === 'listbox', 'FocusGroup passes through role="listbox"', localLogs);
            assert(listbox?.getAttribute('aria-orientation') === 'vertical', 'FocusGroup maps orientation to aria-orientation', localLogs);

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
                <strong>ARIA Facade Verification</strong> ensures standard ARIA attributes passed to components are correctly reflected in the DOM.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">Zone role=""</code>: Should render as the HTML role attribute.</li>
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">Item role=""</code>: Should render as item role.</li>
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">aria-*</code>: Custom ARIA attributes should pass through.</li>
            </ul>
        </div>
    );

    return (
        <TestBox title="ARIA Standard Facade" status={status} logs={logs} onRun={runTest} description={description}>
            <div className="flex flex-col gap-6">

                {/* 1. Tabs Pattern */}
                <div className="space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Tabs Pattern</div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <FocusGroup
                            id="aria-tablist"
                            role="tablist"
                            navigate={{ orientation: 'horizontal' }}
                            className="flex bg-gray-50 border-b border-gray-200"
                        >
                            <FocusItem
                                id="aria-tab-1"
                                role="tab"
                                aria-selected="true"
                                aria-controls="panel-1"
                                className="px-4 py-2 text-sm font-medium text-gray-700 border-b-2 border-blue-500 bg-white"
                            >
                                Account
                            </FocusItem>
                            <FocusItem
                                id="aria-tab-2"
                                role="tab"
                                aria-selected="false"
                                aria-controls="panel-2"
                                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 aria-[current=true]:bg-gray-100"
                            >
                                Password
                            </FocusItem>
                            <FocusItem
                                id="aria-tab-3"
                                role="tab"
                                aria-selected="false"
                                aria-controls="panel-3"
                                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 aria-[current=true]:bg-gray-100"
                            >
                                Billing
                            </FocusItem>
                        </FocusGroup>
                        <div className="p-4 bg-white">
                            <div id="panel-1" role="tabpanel" className="text-sm text-gray-600">Tab panel content for Account...</div>
                        </div>
                    </div>
                </div>

                {/* 2. Radiogroup Pattern */}
                <div className="space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Radio Group</div>
                    <FocusGroup
                        id="aria-radiogroup"
                        role="radiogroup"
                        navigate={{ orientation: 'vertical' }}
                        className="flex flex-col gap-2 p-3 bg-gray-50 rounded border border-gray-200"
                        aria-labelledby="radio-label"
                    >
                        <div id="radio-label" className="text-xs font-semibold text-gray-500 mb-1">Notification Settings</div>
                        {['All new messages', 'Direct messages only', 'Mentions only'].map((opt, i) => {
                            const suffix = ['a', 'b', 'c'][i];
                            const isChecked = i === 1; // Simulate 'Direct messages only' as checked
                            return (
                                <FocusItem
                                    key={suffix}
                                    id={`aria-radio-${suffix}`}
                                    role="radio"
                                    aria-checked={isChecked}
                                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer aria-[current=true]:ring-1 ring-blue-400 outline-none"
                                >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isChecked ? 'border-blue-500' : 'border-gray-400'}`}>
                                        {isChecked && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                    </div>
                                    <span className="text-sm text-gray-700">{opt}</span>
                                </FocusItem>
                            );
                        })}
                    </FocusGroup>
                </div>

                {/* 3. Listbox (Complex) */}
                <div className="space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Detailed Listbox</div>
                    <FocusGroup
                        id="aria-listbox"
                        role="listbox"
                        navigate={{ orientation: 'vertical', loop: true }}
                        className="flex flex-col bg-white border border-gray-200 rounded shadow-sm max-h-40 overflow-y-auto"
                        aria-label="User Selection"
                    >
                        {[
                            { name: 'Wade Cooper', role: 'Admin' },
                            { name: 'Arlene Mccoy', role: 'Member' },
                            { name: 'Devon Webb', role: 'Guest' }
                        ].map((user, i) => (
                            <FocusItem
                                key={user.name}
                                id={`aria-user-${i}`}
                                role="option"
                                className="flex flex-col px-4 py-2 hover:bg-blue-50 aria-[current=true]:bg-blue-50 aria-[current=true]:text-blue-700 outline-none border-l-2 border-transparent aria-[current=true]:border-blue-500"
                            >
                                <span className="text-sm font-medium">{user.name}</span>
                                <span className="text-xs text-gray-500">{user.role}</span>
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </div>

            </div>
        </TestBox>
    );
}
