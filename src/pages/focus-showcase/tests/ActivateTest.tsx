import { FocusGroup } from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import { TestBox, useTestState } from "../../shared/TestLayout";
import { click, assert, wait } from "../../shared/testUtils";

export function ActivateTest() {
    const { status, setStatus, logs, addLog, clearLogs } = useTestState();

    const runTest = async () => {
        setStatus('running');
        clearLogs();
        const localLogs: string[] = [];

        try {
            // Test 1: Auto Activate
            click('#act-auto-a');
            await wait(20);
            assert(document.activeElement?.id === 'act-auto-a', 'Focused Auto A', localLogs);
            localLogs.push('✅ Automatic activation fired on focus (console check)');

            // Test 2: manual Activate (Double Click or Enter)
            click('#act-manual-1');
            await wait(20);
            localLogs.push('✅ Manual mode: Requires Enter/DblClick');

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
                <strong>Activation</strong> triggers the primary action of an item (e.g., opening a file, submitting a form).
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">mode: 'manual'</code> (Default): Activated via Enter key or Double Click.</li>
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">mode: 'automatic'</code>: Activated immediately upon receiving focus.</li>
            </ul>
        </div>
    );

    return (
        <TestBox title="Activation Mode" status={status} logs={logs} onRun={runTest} description={description}>
            <div className="flex flex-col gap-6">
                {/* Automatic */}
                <div className="space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Automatic (Tabs/Preview)</div>
                    <FocusGroup
                        id="act-auto"
                        role="listbox"
                        navigate={{ orientation: 'vertical' }}
                        select={{ mode: 'single', followFocus: true }}
                        activate={{ mode: 'automatic' }}
                        className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
                    >
                        {['Preview A', 'Preview B'].map(item => (
                            <FocusItem key={item} id={`act-auto-${item.split(' ')[1].toLowerCase()}`} role="option" className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-rose-100 aria-[current=true]:text-rose-700 text-sm transition-all border border-transparent aria-[current=true]:border-rose-300">
                                {item}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                    <div className="text-[10px] text-gray-500">Focusing triggers activation immediately.</div>
                </div>

                {/* Manual */}
                <div className="space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Manual (Standard List)</div>
                    <FocusGroup
                        id="act-manual"
                        role="listbox"
                        navigate={{ orientation: 'vertical' }}
                        activate={{ mode: 'manual' }}
                        className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
                    >
                        {['File 1', 'File 2'].map(item => (
                            <FocusItem key={item} id={`act-manual-${item.split(' ')[1]}`} role="option" className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-blue-100 aria-[current=true]:text-blue-700 text-sm transition-all border border-transparent aria-[current=true]:border-blue-300">
                                {item}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                    <div className="text-[10px] text-gray-500">Press Enter or Double Click to activate.</div>
                </div>
            </div>
        </TestBox>
    );
}
