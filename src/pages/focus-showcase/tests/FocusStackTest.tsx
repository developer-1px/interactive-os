import { useState, useRef, useEffect } from "react";
import { FocusGroup } from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import { TestBox, useTestState } from "../../shared/TestLayout";
import { click, press, assert, wait } from "../../shared/testUtils";
import { FocusData } from "@os/features/focus/lib/focusData";

/**
 * FocusStackTest - Modal/Dialog Focus Stack & Scroll Sync
 * 
 * Tests:
 * 1. Focus Stack: Modal open → close → restore previous focus
 * 2. Nested Modals: Dialog → SubDialog → Close → restore chain
 * 3. Scroll Sync: Focus item in scrollable container → auto scroll into view
 * 
 * Uses FocusData.pushFocusStack() and FocusData.popAndRestoreFocus() APIs.
 */

// ═══════════════════════════════════════════════════════════════════
// Modal Component (with Focus Stack via FocusData API)
// ═══════════════════════════════════════════════════════════════════

interface ModalProps {
    id: string;
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

function Modal({ id, isOpen, onClose, title, children }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    // Push focus stack when opening (using FocusData API)
    useEffect(() => {
        if (isOpen) {
            FocusData.pushFocusStack(id);
        }
    }, [isOpen, id]);

    // Handle ESC key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen]);

    // Restore focus when closing (using FocusData API)
    const handleClose = () => {
        onClose();
        // Use FocusData.popAndRestoreFocus() to restore previous focus
        FocusData.popAndRestoreFocus();
    };

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
            onClick={(e) => {
                if (e.target === overlayRef.current) handleClose();
            }}
        >
            <div className="bg-white rounded-lg shadow-xl min-w-[280px] max-w-md overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b">
                    <span className="font-semibold text-sm text-gray-700">{title}</span>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                    >
                        ×
                    </button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// Test Component
// ═══════════════════════════════════════════════════════════════════

export function FocusStackTest() {
    const { status, setStatus, logs, addLog, clearLogs } = useTestState();

    // Modal state
    const [modal1Open, setModal1Open] = useState(false);
    const [modal2Open, setModal2Open] = useState(false);

    // Scroll test ref
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const runTest = async () => {
        setStatus('running');
        clearLogs();
        const localLogs: string[] = [];

        // Clear any stale stack entries from previous test runs
        FocusData.clearFocusStack();

        try {
            // ─────────────────────────────────────────────────────────
            // Test 1: Basic Focus Stack (Single Modal)
            // ─────────────────────────────────────────────────────────
            localLogs.push('→ Test 1: Single Modal Focus Restoration');

            // Focus an item in the base list
            click('#fs-base-2');
            await wait(100);

            const baseFocused = document.activeElement?.id === 'fs-base-2';
            assert(baseFocused, 'Base item focused before modal', localLogs);

            // Check stack is empty before opening modal
            const stackDepthBefore = FocusData.getFocusStackDepth();
            localLogs.push(`  Stack depth before modal: ${stackDepthBefore}`);

            // Open modal
            setModal1Open(true);
            await wait(150);

            // Check stack has one entry after opening modal
            const stackDepthAfterOpen = FocusData.getFocusStackDepth();
            localLogs.push(`  Stack depth after open: ${stackDepthAfterOpen}`);

            // Focus first item in modal
            click('#fs-modal1-1');
            await wait(100);

            const modalFocused = document.activeElement?.id === 'fs-modal1-1';
            assert(modalFocused, 'Modal item focused', localLogs);

            // Close modal via ESC
            press('Escape');
            await wait(150);

            // Check focus restored to base
            const restoredFocus = document.activeElement?.id === 'fs-base-2';
            assert(restoredFocus, 'Focus restored after modal close', localLogs);

            // Check stack is empty after closing
            const stackDepthAfterClose = FocusData.getFocusStackDepth();
            localLogs.push(`  Stack depth after close: ${stackDepthAfterClose}`);

            // ─────────────────────────────────────────────────────────
            // Test 2: Nested Modals (Dialog → SubDialog)
            // ─────────────────────────────────────────────────────────
            localLogs.push('→ Test 2: Nested Modal Focus Stack');

            // Focus base item
            click('#fs-base-3');
            await wait(100);

            // Open first modal
            setModal1Open(true);
            await wait(150);
            click('#fs-modal1-2');
            await wait(100);

            const stackAfterFirst = FocusData.getFocusStackDepth();
            localLogs.push(`  Stack after first modal: ${stackAfterFirst}`);

            // Open second modal from first
            setModal2Open(true);
            await wait(150);
            click('#fs-modal2-1');
            await wait(100);

            const stackAfterSecond = FocusData.getFocusStackDepth();
            localLogs.push(`  Stack after second modal: ${stackAfterSecond}`);

            const nestedFocused = document.activeElement?.id === 'fs-modal2-1';
            assert(nestedFocused, 'Nested modal item focused', localLogs);

            // Close second modal
            setModal2Open(false);
            FocusData.popAndRestoreFocus();
            await wait(150);

            // Should restore to first modal's focused item
            const firstModalRestored = document.activeElement?.id === 'fs-modal1-2';
            assert(firstModalRestored, 'First modal focus restored', localLogs);

            // Close first modal
            setModal1Open(false);
            FocusData.popAndRestoreFocus();
            await wait(150);

            // Should restore to base
            const baseRestored = document.activeElement?.id === 'fs-base-3';
            assert(baseRestored, 'Base focus restored after nested close', localLogs);

            // ─────────────────────────────────────────────────────────
            // Test 3: Scroll Sync
            // ─────────────────────────────────────────────────────────
            localLogs.push('→ Test 3: Scroll Sync on Focus');

            // Scroll container to top
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
            }
            await wait(50);

            // Focus last item (should scroll into view)
            click('#fs-scroll-10');
            await wait(300); // Wait for smooth scroll

            const scrolledItem = document.getElementById('fs-scroll-10');
            const container = scrollContainerRef.current;

            if (container && scrolledItem) {
                const containerRect = container.getBoundingClientRect();
                const itemRect = scrolledItem.getBoundingClientRect();

                // Check if item is visible in container
                const isVisible =
                    itemRect.top >= containerRect.top &&
                    itemRect.bottom <= containerRect.bottom;

                assert(isVisible, 'Item scrolled into view', localLogs);
            } else {
                localLogs.push('⚠️ Scroll container or item not found');
            }

            setStatus('pass');
        } catch (e: any) {
            localLogs.push(`❌ ${e.message}`);
            setStatus('fail');
        } finally {
            // Cleanup
            setModal1Open(false);
            setModal2Open(false);
            FocusData.clearFocusStack();
            localLogs.forEach(addLog);
        }
    };

    const description = (
        <div className="space-y-2">
            <p>
                <strong>Focus Stack & Scroll Sync</strong> tests dialog focus management.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li><strong>Focus Stack</strong>: Modal open/close restores previous focus via <code className="text-xs bg-gray-100 px-1 rounded">FocusData.pushFocusStack()</code>.</li>
                <li><strong>Nested Modals</strong>: Stacked dialogs maintain focus chain.</li>
                <li><strong>Scroll Sync</strong>: Focused item auto-scrolls into view.</li>
            </ul>
        </div>
    );

    // Items for scroll test
    const scrollItems = Array.from({ length: 15 }, (_, i) => `Item ${i + 1}`);

    return (
        <TestBox
            title="Focus Stack / Scroll"
            status={status}
            logs={logs}
            onRun={runTest}
            description={description}
        >
            <div className="flex flex-col gap-4">
                {/* Base List */}
                <div className="space-y-1">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Base Zone</div>
                    <FocusGroup
                        id="fs-base"
                        role="listbox"
                        navigate={{ orientation: 'vertical' }}
                        select={{ mode: 'single' }}
                        className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
                    >
                        {['Button 1', 'Button 2', 'Button 3'].map((item, i) => (
                            <FocusItem
                                key={item}
                                id={`fs-base-${i + 1}`}
                                role="option"
                                className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-blue-100 aria-[current=true]:text-blue-700 text-sm transition-all"
                            >
                                {item}
                                {i === 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setModal1Open(true)}
                                        className="ml-2 text-xs text-blue-500 hover:underline"
                                    >
                                        Open Modal
                                    </button>
                                )}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </div>

                {/* Scroll Sync Test */}
                <div className="space-y-1">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Scroll Sync Test</div>
                    <div
                        ref={scrollContainerRef}
                        className="h-24 overflow-y-auto border border-gray-200 rounded bg-gray-50"
                    >
                        <FocusGroup
                            id="fs-scroll"
                            role="listbox"
                            navigate={{ orientation: 'vertical' }}
                            className="flex flex-col p-1 gap-0.5"
                        >
                            {scrollItems.map((item, i) => (
                                <FocusItem
                                    key={item}
                                    id={`fs-scroll-${i + 1}`}
                                    role="option"
                                    className="px-2 py-1 rounded hover:bg-gray-100 aria-[current=true]:bg-emerald-100 aria-[current=true]:text-emerald-700 text-xs transition-all shrink-0"
                                >
                                    {item}
                                </FocusItem>
                            ))}
                        </FocusGroup>
                    </div>
                    <div className="text-[10px] text-gray-500">Navigate to bottom items to test scroll sync.</div>
                </div>
            </div>

            {/* Modal 1 */}
            <Modal
                id="modal1"
                isOpen={modal1Open}
                onClose={() => setModal1Open(false)}
                title="Modal 1"
            >
                <FocusGroup
                    id="fs-modal1"
                    role="menu"
                    navigate={{ orientation: 'vertical' }}
                    project={{ autoFocus: true }}
                    className="flex flex-col gap-1"
                >
                    {['Modal Item A', 'Modal Item B'].map((item, i) => (
                        <FocusItem
                            key={item}
                            id={`fs-modal1-${i + 1}`}
                            role="menuitem"
                            className="px-3 py-2 rounded hover:bg-gray-100 aria-[current=true]:bg-violet-100 aria-[current=true]:text-violet-700 text-sm transition-all"
                        >
                            {item}
                            {i === 1 && (
                                <button
                                    type="button"
                                    onClick={() => setModal2Open(true)}
                                    className="ml-2 text-xs text-violet-500 hover:underline"
                                >
                                    Open Sub-Modal
                                </button>
                            )}
                        </FocusItem>
                    ))}
                </FocusGroup>
            </Modal>

            {/* Modal 2 (Nested) */}
            <Modal
                id="modal2"
                isOpen={modal2Open}
                onClose={() => setModal2Open(false)}
                title="Sub-Modal"
            >
                <FocusGroup
                    id="fs-modal2"
                    role="menu"
                    navigate={{ orientation: 'vertical' }}
                    project={{ autoFocus: true }}
                    className="flex flex-col gap-1"
                >
                    {['Sub Item 1', 'Sub Item 2'].map((item, i) => (
                        <FocusItem
                            key={item}
                            id={`fs-modal2-${i + 1}`}
                            role="menuitem"
                            className="px-3 py-2 rounded hover:bg-gray-100 aria-[current=true]:bg-pink-100 aria-[current=true]:text-pink-700 text-sm transition-all"
                        >
                            {item}
                        </FocusItem>
                    ))}
                </FocusGroup>
            </Modal>
        </TestBox>
    );
}
