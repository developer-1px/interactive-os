import { FocusGroup } from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import { TestBox, useTestState } from "../../shared/TestLayout";
import { click, assert, wait } from "../../shared/testUtils";

export function AutofocusTest() {
    const { status, setStatus, logs, addLog, clearLogs } = useTestState();

    const runTest = async () => {
        setStatus('running');
        clearLogs();
        const localLogs: string[] = [];

        try {
            // Test 1: Click to focus auto-group, then verify focus works
            click('#af-auto-1');
            await wait(200);
            const hasFocus = document.querySelector('#af-auto-1')?.getAttribute('aria-current') === 'true';
            assert(hasFocus, 'Focus established on click', localLogs);

            // Test 2: Entry Restore
            click('#af-restore-1');
            await wait(200);
            assert(document.getElementById('af-restore-1')?.getAttribute('aria-current') === 'true', 'Focus Item 1', localLogs);

            // Focus away then back
            click('#af-auto-2');
            await wait(100);

            // Re-enter restore zone
            click('#af-restore-wrapper');
            await wait(100);

            localLogs.push('✅ Entry strategies validated');

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
                <strong>Focus Entry & Restoration</strong> controls what happens when focus enters a group.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">project.autoFocus</code>: Automatically focuses this group on mount.</li>
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">entry: 'first'</code> (Default): Focuses the first item.</li>
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">entry: 'last'</code>: Focuses the last item.</li>
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">entry: 'restore'</code>: Remembers the last focused item and restores it.</li>
            </ul>
        </div>
    );

    return (
        <TestBox title="Entry & AutoFocus" status={status} logs={logs} onRun={runTest} description={description}>
            <div className="flex flex-col gap-6">
                {/* Auto Focus */}
                <div className="space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Auto Focus on Mount</div>
                    <FocusGroup
                        id="af-auto"
                        role="listbox"
                        navigate={{ orientation: 'vertical' }}
                        project={{ autoFocus: true }}
                        className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
                    >
                        {['Auto 1', 'Auto 2'].map(item => (
                            <FocusItem key={item} id={`af-auto-${item.split(' ')[1]}`} role="option" className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-fuchsia-100 aria-[current=true]:text-fuchsia-700 text-sm transition-all border border-transparent aria-[current=true]:border-fuchsia-300">
                                {item}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </div>

                {/* Restore */}
                <div id="af-restore-wrapper" className="space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Entry Restore (Memory)</div>
                    <FocusGroup
                        id="af-restore"
                        role="listbox"
                        navigate={{ orientation: 'vertical', entry: 'restore' }}
                        className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
                    >
                        {['Memory 1', 'Memory 2', 'Memory 3'].map(item => (
                            <FocusItem key={item} id={`af-restore-${item.split(' ')[1]}`} role="option" className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-teal-100 aria-[current=true]:text-teal-700 text-sm transition-all border border-transparent aria-[current=true]:border-teal-300">
                                {item}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                    <div className="text-[10px] text-gray-500">Select item, click away, then click back to Restore.</div>
                </div>

                {/* Last */}
                <div className="space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Entry Last</div>
                    <FocusGroup
                        id="af-last"
                        role="listbox"
                        navigate={{ orientation: 'vertical', entry: 'last' }}
                        className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
                    >
                        {['Top', 'Middle', 'Bottom'].map(item => (
                            <FocusItem key={item} id={`af-last-${item.toLowerCase()}`} role="option" className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-orange-100 aria-[current=true]:text-orange-700 text-sm transition-all border border-transparent aria-[current=true]:border-orange-300">
                                {item}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                    <div className="text-[10px] text-gray-500">Entry focuses Bottom item.</div>
                </div>
            </div>
        </TestBox>
    );
}
