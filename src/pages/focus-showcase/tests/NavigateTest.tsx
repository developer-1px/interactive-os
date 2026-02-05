import { FocusGroup } from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import { TestBox, useTestState } from "../shared/TestLayout";
import { click, navigate, assert, wait } from "../shared/testUtils";

export function NavigateTest() {
    const { status, setStatus, logs, addLog, clearLogs } = useTestState();

    const runTest = async () => {
        setStatus('running');
        clearLogs();
        const localLogs: string[] = [];

        try {
            // Test 1: Vertical List (Loop)
            click('#nav-apple');
            await wait(100);
            navigate('UP');
            await wait(100);
            assert(
                document.querySelector('#nav-cherry')?.getAttribute('aria-current') === 'true',
                'Vertical Loop UP -> Cherry',
                localLogs
            );

            // Test 2: Horizontal Toolbar (No Loop)
            click('#nav-bold');
            await wait(100);
            navigate('LEFT');
            await wait(100);
            assert(
                document.querySelector('#nav-bold')?.getAttribute('aria-current') === 'true',
                'Horizontal No-Loop LEFT -> Blocked',
                localLogs
            );

            // Test 3: Grid Spatial
            click('#nav-cell-0');
            await wait(100);
            navigate('RIGHT');
            await wait(100);
            assert(
                document.querySelector('#nav-cell-1')?.getAttribute('aria-current') === 'true',
                '2D Spatial RIGHT',
                localLogs
            );
            navigate('DOWN');
            await wait(100);
            assert(
                document.querySelector('#nav-cell-4')?.getAttribute('aria-current') === 'true',
                '2D Spatial DOWN',
                localLogs
            );

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
                <strong>Navigation Strategies</strong> define how arrow keys move focus within a group.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">orientation</code>: 'vertical' | 'horizontal' | 'both'</li>
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">loop</code>: Wraps focus from start to end (and vice-versa).</li>
                <li><code className="text-gray-700 bg-gray-100 px-1 rounded">wrapping</code>: In 'both' mode, wraps to next row/column.</li>
            </ul>
        </div>
    );

    return (
        <TestBox title="Directional Navigation" status={status} logs={logs} onRun={runTest} description={description}>
            <div className="flex flex-col gap-6">
                {/* Vertical List with Loop */}
                <div className="space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Vertical + Loop</div>
                    <FocusGroup id="nav-list" role="listbox" navigate={{ orientation: 'vertical', loop: true }} className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1">
                        {['Apple', 'Banana', 'Cherry'].map(fruit => (
                            <FocusItem key={fruit} id={`nav-${fruit.toLowerCase()}`} role="option" className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-blue-100 aria-[current=true]:text-blue-700 aria-[current=true]:border-l-2 border-blue-500 text-sm border-l-2 border-transparent">
                                {fruit}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </div>

                {/* Horizontal Toolbar (No Loop) */}
                <div className="space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Horizontal (Clamped)</div>
                    <FocusGroup id="nav-toolbar" role="toolbar" navigate={{ orientation: 'horizontal', loop: false }} className="flex bg-gray-50 p-2 rounded border border-gray-200 gap-1">
                        {['Bold', 'Italic', 'Underline'].map(action => (
                            <FocusItem key={action} id={`nav-${action.toLowerCase()}`} role="button" className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-purple-100 aria-[current=true]:text-purple-700 text-sm border border-transparent aria-[current=true]:border-purple-300">
                                {action[0]}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </div>

                {/* Grid 2D */}
                <div className="space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Spatial 2D Grid</div>
                    <FocusGroup id="nav-grid" role="grid" navigate={{ orientation: 'both' }} className="grid grid-cols-3 bg-gray-50 p-2 rounded border border-gray-200 gap-2">
                        {Array.from({ length: 9 }, (_, i) => (
                            <FocusItem key={i} id={`nav-cell-${i}`} role="gridcell" className="aspect-square flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 aria-[current=true]:bg-emerald-100 aria-[current=true]:text-emerald-700 aria-[current=true]:ring-1 ring-emerald-400 text-xs cursor-pointer">
                                {i}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </div>
            </div>
        </TestBox>
    );
}
