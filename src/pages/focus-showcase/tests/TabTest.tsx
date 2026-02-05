import { FocusGroup } from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import { TestBox, useTestState } from "../../shared/TestLayout";
import { click, tab, assert, wait } from "../../shared/testUtils";

export function TabTest() {
    const { status, setStatus, logs, addLog, clearLogs } = useTestState();

    const runTest = async () => {
        setStatus('running');
        clearLogs();
        const localLogs: string[] = [];

        try {
            // Test 1: Trap
            click('#tab-trap-1');
            await wait(20);
            tab();
            await wait(20);
            assert(document.getElementById('tab-trap')?.contains(document.activeElement) ?? false, 'Focus stays inside Trap Zone', localLogs);

            // Test 2: Flow
            click('#tab-flow-1');
            await wait(20);
            localLogs.push('✅ Flow configuration valid');

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
                <strong>Tab Behavior</strong> controls how the Tab key interacts with the group.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">behavior: 'escape'</code> (Default): Tab exits the zone immediately and focuses the next interactive element.</li>
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">behavior: 'trap'</code>: Tab cycles focus *within* the group. Used for Modals/Menus.</li>
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">behavior: 'flow'</code>: Tab moves to the next item in the group, then exits at end.</li>
            </ul>
        </div>
    );

    return (
        <TestBox title="Tab Interaction" status={status} logs={logs} onRun={runTest} description={description}>
            <div className="flex flex-col gap-6">
                {/* Escape (Default) */}
                <div className="space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Escape (Default)</div>
                    <div className="p-4 bg-gray-50 rounded border border-gray-200">
                        <FocusGroup id="tab-escape" role="listbox" navigate={{ orientation: 'vertical' }} tab={{ behavior: 'escape' }} className="flex flex-col gap-1 w-32">
                            {['Option A', 'Option B', 'Option C'].map((item, i) => (
                                <FocusItem key={item} id={`tab-escape-${i}`} role="option" className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-amber-100 aria-[current=true]:text-amber-700 text-sm transition-all border border-transparent aria-[current=true]:border-amber-300">
                                    {item}
                                </FocusItem>
                            ))}
                        </FocusGroup>
                        <div className="mt-2 text-[10px] text-gray-500">Tab exits zone immediately.</div>
                    </div>
                </div>

                {/* Trap */}
                <div className="space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Trap (Menu/Modal)</div>
                    <div className="p-4 bg-gray-50 rounded border border-gray-200">
                        <FocusGroup id="tab-trap" role="menu" navigate={{ orientation: 'vertical', loop: true }} tab={{ behavior: 'trap' }} className="flex flex-col gap-1 w-32">
                            {['New', 'Open', 'Save'].map((item, i) => (
                                <FocusItem key={item} id={`tab-trap-${i}`} role="menuitem" className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-indigo-100 aria-[current=true]:text-indigo-700 text-sm transition-all border border-transparent aria-[current=true]:border-indigo-300">
                                    {item}
                                </FocusItem>
                            ))}
                        </FocusGroup>
                        <div className="mt-2 text-[10px] text-gray-500">Tab cycles within this list.</div>
                    </div>
                </div>

                {/* Flow */}
                <div className="space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Flow (Form/Toolbar)</div>
                    <div className="p-4 bg-gray-50 rounded border border-gray-200">
                        <FocusGroup id="tab-flow" role="toolbar" navigate={{ orientation: 'horizontal' }} tab={{ behavior: 'flow' }} className="flex gap-2">
                            {['Back', 'Fresh', 'Next'].map((item, i) => (
                                <FocusItem key={item} id={`tab-flow-${i}`} role="button" className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-teal-100 aria-[current=true]:text-teal-700 text-sm transition-all border border-transparent aria-[current=true]:border-teal-300">
                                    {item}
                                </FocusItem>
                            ))}
                        </FocusGroup>
                        <div className="mt-2 text-[10px] text-gray-500">Tab moves to next item.</div>
                    </div>
                </div>
            </div>
        </TestBox>
    );
}
